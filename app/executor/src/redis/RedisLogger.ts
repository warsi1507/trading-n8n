import { getRedisClient } from './client';
import { createLogger } from '@trading-n8n/logger';
import { ExecutionStatus, NodeExecutionStatus } from '@trading-n8n/common';

const logger = createLogger('REDIS_LOGGER');

export const EXECUTION_STREAM_KEY = 'workflow:executions:stream';

export interface ExecutionEventPayload {
  workflowId: string;
  executionId: string;
  nodeId?: string;
  status: ExecutionStatus | NodeExecutionStatus;
  startedAt?: Date;
  endedAt?: Date;
  durationMs?: number;
  inputData?: string;
  outputData?: string;
  error?: string;
}

export class RedisLogger {
  /**
   * Pushes a state change event to the Redis Stream.
   * This is extremely fast and allows the Engine to quickly log state without waiting for MongoDB.
   */
  static async logEvent(payload: ExecutionEventPayload): Promise<void> {
    try {
      const redis = getRedisClient();
      
      const record: Record<string, string> = {
        workflowId: payload.workflowId,
        executionId: payload.executionId,
        status: payload.status,
      };

      if (payload.nodeId) record.nodeId = payload.nodeId;
      if (payload.startedAt) record.startedAt = payload.startedAt.toISOString();
      if (payload.endedAt) record.endedAt = payload.endedAt.toISOString();
      if (payload.durationMs !== undefined) record.durationMs = payload.durationMs.toString();
      if (payload.inputData) record.inputData = payload.inputData;
      if (payload.outputData) record.outputData = payload.outputData;
      if (payload.error) record.error = payload.error;

      await redis.xadd(EXECUTION_STREAM_KEY, '*', ...Object.entries(record).flat());
    } catch (error: any) {
      logger.error('Failed to append to execution stream', { error: error.message, payload });
    }
  }
}
