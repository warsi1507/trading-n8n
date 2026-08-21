import { createLogger } from '@trading-n8n/logger';
import { activeTriggers } from '../cache/ActiveTriggers';
import { WorkflowEngine } from '../engine/Engine';
import { debouncer } from '../cache/Debouncer';

const logger = createLogger('WS_MANAGER');

export class WebSocketManager {
  private activeSubscriptions: Set<string> = new Set();
  // Tracks the last known price per asset to evaluate threshold crossings
  private lastPrices: Map<string, number> = new Map();

  /**
   * Called by the system when the cache updates.
   * Compares currently active symbols against our WebSocket subscriptions
   * and subscribes/unsubscribes as necessary.
   */
  syncSubscriptions(): void {
    const requiredAssets = new Set(activeTriggers.getActiveAssets());

    // Subscribe to new assets
    for (const asset of requiredAssets) {
      if (!this.activeSubscriptions.has(asset)) {
        this.subscribeToAsset(asset);
      }
    }

    // Unsubscribe from removed assets
    for (const asset of this.activeSubscriptions) {
      if (!requiredAssets.has(asset)) {
        this.unsubscribeFromAsset(asset);
      }
    }
  }

  private subscribeToAsset(asset: string): void {
    logger.info('Subscribing to live price feed', { asset });
    this.activeSubscriptions.add(asset);
    // TODO: Actually send the subscribe payload to the exchange's WebSocket connection
  }

  private unsubscribeFromAsset(asset: string): void {
    logger.info('Unsubscribing from live price feed', { asset });
    this.activeSubscriptions.delete(asset);
    this.lastPrices.delete(asset);
    // TODO: Actually send the unsubscribe payload to the exchange
  }

  /**
   * This method will be called directly by the incoming WebSocket message handler
   * whenever a new price tick arrives from the exchange.
   */
  public handlePriceTick(asset: string, currentPrice: number): void {
    const previousPrice = this.lastPrices.get(asset);
    this.lastPrices.set(asset, currentPrice);

    // If we have no previous price, we can't evaluate "crosses", so we just store it and wait for the next tick
    if (previousPrice === undefined) return;

    const triggers = activeTriggers.getTriggersForAsset(asset);
    if (triggers.length === 0) return;

    for (const trigger of triggers) {
      if (this.evaluateTriggerCondition(trigger.targetPrice, previousPrice, currentPrice)) {
        // Evaluate cooldown debounce
        if (!debouncer.shouldFire(trigger.workflowId)) {
          continue; // Skip this trigger, it's cooling down
        }

        logger.info('TRIGGER FIRED', { 
          workflowId: trigger.workflowId, 
          asset, 
          targetPrice: trigger.targetPrice, 
          currentPrice 
        });
        
        // Start the Engine in the background
        WorkflowEngine.execute(trigger.workflowId, trigger.nodeId, { asset, currentPrice }).catch((err) => {
          logger.error('Failed to start engine from trigger', { error: err.message });
        });
      }
    }
  }

  private evaluateTriggerCondition(
    targetPrice: number,
    previousPrice: number,
    currentPrice: number
  ): boolean {
    // True if price crossed above OR below the target price
    const crossedAbove = previousPrice < targetPrice && currentPrice >= targetPrice;
    const crossedBelow = previousPrice > targetPrice && currentPrice <= targetPrice;
    return crossedAbove || crossedBelow;
  }
}

export const wsManager = new WebSocketManager();
