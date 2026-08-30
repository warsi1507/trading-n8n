import { getRedisClient } from './client';
import { EXECUTION_STREAM_KEY } from './RedisLogger';
import { Execution } from '@trading-n8n/db';
import { createLogger } from '@trading-n8n/logger';

const logger = createLogger('MONGO_WORKER');

const CONSUMER_GROUP = 'mongo-sync-group';
const CONSUMER_NAME = `worker-${process.pid}`;
const MAX_RETRIES = 3;

export class MongoWorker {
  private isRunning = false;
  private retryCounts: Map<string, number> = new Map();

  async start(): Promise<void> {
    this.isRunning = true;
    const redis = getRedisClient();

    try {
      await redis.xgroup('CREATE', EXECUTION_STREAM_KEY, CONSUMER_GROUP, '0', 'MKSTREAM');
      logger.info('Created Redis consumer group', { group: CONSUMER_GROUP });
    } catch (err: any) {
      if (!err.message.includes('BUSYGROUP')) {
        logger.error('Failed to create consumer group', { error: err.message });
      }
    }

    logger.info('MongoWorker started listening for execution logs...');
    this.poll();
  }

  stop(): void {
    this.isRunning = false;
  }

  private async poll(): Promise<void> {
    const redis = getRedisClient();

    while (this.isRunning) {
      try {
        const results = await redis.xreadgroup(
          'GROUP', CONSUMER_GROUP, CONSUMER_NAME,
          'COUNT', 10,
          'BLOCK', 5000,
          'STREAMS', EXECUTION_STREAM_KEY,
          '>'
        );

        if (results && results.length > 0) {
          const stream = results[0];
          const messages = stream[1];

          for (const message of messages) {
            const [messageId, fields] = message;
            if (!fields) continue;

            try {
              await this.processMessage(fields as string[]);
              await redis.xack(EXECUTION_STREAM_KEY, CONSUMER_GROUP, messageId);
              this.retryCounts.delete(messageId);
            } catch (err: any) {
              const retries = (this.retryCounts.get(messageId) || 0) + 1;
              this.retryCounts.set(messageId, retries);

              if (retries >= MAX_RETRIES) {
                logger.error('Message exceeded max retries, acknowledging to unblock queue', {
                  messageId,
                  retries,
                  error: err.message,
                });
                await redis.xack(EXECUTION_STREAM_KEY, CONSUMER_GROUP, messageId);
                this.retryCounts.delete(messageId);
              } else {
                logger.warn('MongoDB write failed, message will be retried', {
                  messageId,
                  attempt: retries,
                  error: err.message,
                });
              }
            }
          }
        }
      } catch (error: any) {
        logger.error('Error polling Redis stream', { error: error.message });
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  private async processMessage(fields: string[]): Promise<void> {
    const payload: Record<string, any> = {};
    for (let i = 0; i < fields.length; i += 2) {
      payload[fields[i]] = fields[i + 1];
    }

    const {
      executionId, nodeId, status,
      startedAt, endedAt, durationMs,
      inputData, outputData, error,
    } = payload;

    if (!executionId) return;

    if (nodeId) {
      // Node-level update
      const update: any = {
        'nodes.$.status': status,
      };
      
      if (startedAt) update['nodes.$.started_at'] = new Date(startedAt);
      if (endedAt) update['nodes.$.ended_at'] = new Date(endedAt);
      if (durationMs) update['nodes.$.duration_ms'] = parseInt(durationMs, 10);
      if (inputData) update['nodes.$.input_data'] = JSON.parse(inputData);
      if (outputData) update['nodes.$.output_data'] = JSON.parse(outputData);
      if (error) update['nodes.$.error'] = error;

      await Execution.findOneAndUpdate(
        { _id: executionId, 'nodes.node_id': nodeId },
        { $set: update }
      );
    } else {
      // Global execution update
      const update: any = { status };
      
      if (startedAt) update.started_at = new Date(startedAt);
      if (endedAt) update.ended_at = new Date(endedAt);
      if (durationMs) update.duration_ms = parseInt(durationMs, 10);
      if (error) update.error = error;

      await Execution.findByIdAndUpdate(executionId, { $set: update });

      if (status === 'FAILED') {
        import('../services/NotificationService').then(({ NotificationService }) => {
          NotificationService.sendExecutionFailureEmail(executionId, error);
        });
      }
    }
  }
}
