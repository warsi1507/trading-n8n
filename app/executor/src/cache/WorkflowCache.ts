import { createLogger } from '@trading-n8n/logger';
import type { AppNode, AppEdge } from '@trading-n8n/common';

const logger = createLogger('WORKFLOW_CACHE');

export interface CachedWorkflow {
  workflowId: string;
  userId: string;
  nodes: AppNode[];
  edges: AppEdge[];
}

class WorkflowCache {
  private cache: Map<string, CachedWorkflow> = new Map();

  set(workflowId: string, data: CachedWorkflow): void {
    this.cache.set(workflowId, data);
  }

  get(workflowId: string): CachedWorkflow | undefined {
    return this.cache.get(workflowId);
  }

  remove(workflowId: string): void {
    this.cache.delete(workflowId);
  }

  clear(): void {
    this.cache.clear();
    logger.info('Workflow cache cleared');
  }
}

export const workflowCache = new WorkflowCache();
