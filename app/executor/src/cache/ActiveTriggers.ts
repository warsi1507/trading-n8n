import { createLogger } from '@trading-n8n/logger';
import { debouncer } from './Debouncer';

const logger = createLogger('ACTIVE_TRIGGERS');

export interface TriggerDefinition {
  workflowId: string;
  userId: string;
  nodeId: string;
  asset: string;
  targetPrice: number;
}

class ActiveTriggerCache {
  // Map of Asset -> Array of Triggers
  private triggers: Map<string, TriggerDefinition[]> = new Map();

  /**
   * Adds a new trigger to the memory cache.
   */
  addTrigger(trigger: TriggerDefinition): void {
    const existing = this.triggers.get(trigger.asset) || [];
    existing.push(trigger);
    this.triggers.set(trigger.asset, existing);
    logger.info('Trigger added to cache', { workflowId: trigger.workflowId, asset: trigger.asset });
  }

  /**
   * Removes all triggers associated with a specific workflow.
   * Useful when a workflow is paused or deleted.
   */
  removeWorkflowTriggers(workflowId: string): void {
    let removedCount = 0;
    
    for (const [asset, assetTriggers] of this.triggers.entries()) {
      const filtered = assetTriggers.filter((t) => t.workflowId !== workflowId);
      if (filtered.length !== assetTriggers.length) {
        removedCount += (assetTriggers.length - filtered.length);
      }
      
      if (filtered.length === 0) {
        this.triggers.delete(asset);
      } else {
        this.triggers.set(asset, filtered);
      }
    }
    
    if (removedCount > 0) {
      debouncer.clearCooldown(workflowId);
      logger.info('Removed triggers for workflow', { workflowId, count: removedCount });
    }
  }

  /**
   * Returns all triggers listening to a specific asset.
   */
  getTriggersForAsset(asset: string): TriggerDefinition[] {
    return this.triggers.get(asset) || [];
  }

  /**
   * Returns a list of all unique assets currently being watched.
   * Useful for telling the WebSocketManager which feeds to subscribe to.
   */
  getActiveAssets(): string[] {
    return Array.from(this.triggers.keys());
  }

  /**
   * Clears the entire cache.
   */
  clear(): void {
    this.triggers.clear();
    logger.info('Active triggers cache cleared');
  }
}

export const activeTriggers = new ActiveTriggerCache();
