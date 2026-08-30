import { WorkflowEngine } from './Engine';
import { createLogger } from '@trading-n8n/logger';
import { workflowCache } from '../cache/WorkflowCache';

const logger = createLogger('TIME_MANAGER');

class TimeTriggerManager {
  // Map of workflowId -> NodeJS.Timeout
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  public syncTimers(): void {
    // Clear all existing intervals
    for (const timer of this.intervals.values()) {
      clearInterval(timer);
    }
    this.intervals.clear();

    // Scan workflowCache for time-triggers
    const cachedWorkflows = workflowCache.getAll();
    let count = 0;

    for (const wf of cachedWorkflows) {
      for (const node of wf.nodes) {
        if (node.type === 'time-trigger' && node.data && node.data.metadata) {
          const metadata = node.data.metadata as any;
          const timeSecs = Number(metadata.time);

          if (timeSecs && timeSecs > 0) {
            // Schedule the interval
            const intervalMs = timeSecs * 1000;
            const timer = setInterval(() => {
              logger.info('TIME TRIGGER FIRED', { workflowId: wf.workflowId, intervalMs });
              
              const payload = { firedAt: new Date().toISOString(), triggerType: 'TIME' };
              WorkflowEngine.execute(wf.workflowId, node.id, payload).catch((err: any) => {
                logger.error('Failed to execute time-triggered workflow', { workflowId: wf.workflowId, error: err.message });
              });
            }, intervalMs);

            this.intervals.set(wf.workflowId, timer);
            count++;
          }
        }
      }
    }

    if (count > 0) {
      logger.info('Time triggers synchronized', { activeTimers: count });
    }
  }

  public disconnect() {
    for (const timer of this.intervals.values()) {
      clearInterval(timer);
    }
    this.intervals.clear();
  }
}

export const timeManager = new TimeTriggerManager();
