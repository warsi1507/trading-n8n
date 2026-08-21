import { createLogger } from '@trading-n8n/logger';

const logger = createLogger('DEBOUNCER');

export class TriggerDebouncer {
  // Maps workflowId -> timestamp of last execution
  private lastFired: Map<string, number> = new Map();
  
  // Default cooldown in milliseconds
  private readonly DEFAULT_COOLDOWN_MS = 60 * 1000;

  /**
   * Checks if a workflow is allowed to fire.
   * If it is, it automatically updates the last fired timestamp.
   * Returns true if allowed, false if debounced (cooling down).
   */
  shouldFire(workflowId: string): boolean {
    const now = Date.now();
    const last = this.lastFired.get(workflowId);

    if (last !== undefined) {
      const timeSinceLastFire = now - last;
      if (timeSinceLastFire < this.DEFAULT_COOLDOWN_MS) {
        logger.debug('Workflow trigger debounced (cooling down)', { 
          workflowId, 
          remainingCooldownMs: this.DEFAULT_COOLDOWN_MS - timeSinceLastFire 
        });
        return false;
      }
    }

    // It's allowed to fire, update the timestamp
    this.lastFired.set(workflowId, now);
    return true;
  }

  /**
   * Clears the debounce history for a specific workflow (useful if modified/redeployed).
   */
  clearCooldown(workflowId: string): void {
    this.lastFired.delete(workflowId);
  }
}

export const debouncer = new TriggerDebouncer();
