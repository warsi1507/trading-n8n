import WebSocket from 'ws';
import { createLogger } from '@trading-n8n/logger';
import { activeTriggers } from '../cache/ActiveTriggers';
import { WorkflowEngine } from '../engine/Engine';
import { debouncer } from '../cache/Debouncer';
import type { SupportedAsset } from '@trading-n8n/common';

const logger = createLogger('WS_MANAGER');

/**
 * Maps our internal asset names to Binance miniTicker stream names.
 * miniTicker is lighter than the full ticker and provides the current close price.
 */
const ASSET_TO_STREAM: Record<string, string> = {
  BTC: 'btcusdt@miniTicker',
  ETH: 'ethusdt@miniTicker',
  SOL: 'solusdt@miniTicker',
};

const BINANCE_WS_URL = 'wss://stream.binance.com:9443/stream';
const RECONNECT_DELAY_MS = 5000;

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private activeSubscriptions: Set<string> = new Set();
  private lastPrices: Map<string, number> = new Map();
  private requestId = 1;
  private isConnected = false;
  private pendingSubs: Set<string> = new Set();

  /**
   * Called on startup and after every hot-reload.
   * Compares active trigger assets with current WS subscriptions
   * and subscribes/unsubscribes as needed.
   */
  syncSubscriptions(): void {
    const requiredAssets = new Set(activeTriggers.getActiveAssets());

    const toSubscribe = [...requiredAssets].filter((a) => !this.activeSubscriptions.has(a));
    const toUnsubscribe = [...this.activeSubscriptions].filter((a) => !requiredAssets.has(a));

    if (toSubscribe.length === 0 && toUnsubscribe.length === 0) return;

    if (!this.isConnected) {
      // Queue them up — connect() will flush pending subs once the socket is open
      for (const asset of toSubscribe) this.pendingSubs.add(asset);
      for (const asset of toUnsubscribe) this.activeSubscriptions.delete(asset);
      this.connect();
      return;
    }

    for (const asset of toSubscribe) this.subscribeToAsset(asset);
    for (const asset of toUnsubscribe) this.unsubscribeFromAsset(asset);
  }

  private connect(): void {
    if (this.ws) {
      this.ws.removeAllListeners();
      this.ws.terminate();
      this.ws = null;
    }

    logger.info('Connecting to Binance WebSocket...');
    this.ws = new WebSocket(BINANCE_WS_URL);

    this.ws.on('open', () => {
      this.isConnected = true;
      logger.info('Binance WebSocket connection established');

      // Flush any subscriptions that were pending while disconnected
      for (const asset of this.pendingSubs) {
        this.subscribeToAsset(asset);
      }
      this.pendingSubs.clear();
    });

    this.ws.on('message', (raw: WebSocket.RawData) => {
      this.handleMessage(raw.toString());
    });

    this.ws.on('error', (err) => {
      logger.error('Binance WebSocket error', { error: err.message });
    });

    this.ws.on('close', () => {
      this.isConnected = false;
      logger.warn('Binance WebSocket disconnected. Reconnecting...');

      if (this.activeSubscriptions.size > 0) {
        setTimeout(() => this.connect(), RECONNECT_DELAY_MS);
      }
    });
  }

  private subscribeToAsset(asset: string): void {
    const stream = ASSET_TO_STREAM[asset as SupportedAsset];
    if (!stream) {
      logger.warn('No Binance stream mapping for asset', { asset });
      return;
    }

    this.activeSubscriptions.add(asset);

    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({
        method: 'SUBSCRIBE',
        params: [stream],
        id: this.requestId++,
      }));
      logger.info('Subscribed to Binance stream', { asset, stream });
    }
  }

  private unsubscribeFromAsset(asset: string): void {
    const stream = ASSET_TO_STREAM[asset as SupportedAsset];
    this.activeSubscriptions.delete(asset);
    this.lastPrices.delete(asset);

    if (this.isConnected && this.ws && stream) {
      this.ws.send(JSON.stringify({
        method: 'UNSUBSCRIBE',
        params: [stream],
        id: this.requestId++,
      }));
      logger.info('Unsubscribed from Binance stream', { asset, stream });
    }

    // If no more subscriptions, close the connection cleanly
    if (this.activeSubscriptions.size === 0) {
      this.ws?.terminate();
      this.ws = null;
      this.isConnected = false;
      logger.info('No active subscriptions, Binance WebSocket closed');
    }
  }

  /**
   * Parses an incoming Binance combined stream message.
   * MiniTicker payload has field `c` for the current close price.
   */
  private handleMessage(raw: string): void {
    try {
      const msg = JSON.parse(raw);

      // Binance combined stream wraps messages: { stream: "btcusdt@miniTicker", data: {...} }
      if (!msg.stream || !msg.data) return;

      const streamName: string = msg.stream;
      const data = msg.data;

      // Resolve the asset from the stream name (e.g. "btcusdt@miniTicker" -> "BTC")
      const asset = Object.entries(ASSET_TO_STREAM).find(
        ([, s]) => s === streamName
      )?.[0];

      if (!asset) return;

      const currentPrice = parseFloat(data.c);
      if (!currentPrice || isNaN(currentPrice)) return;

      this.handlePriceTick(asset, currentPrice);
    } catch {
      // Non-JSON messages (e.g. Binance subscription confirmations) are ignored
    }
  }

  /**
   * Core price evaluation logic. Called every time a new price arrives.
   * Checks all active triggers for the given asset and fires the engine if crossed.
   */
  public handlePriceTick(asset: string, currentPrice: number): void {
    const previousPrice = this.lastPrices.get(asset);
    this.lastPrices.set(asset, currentPrice);

    if (previousPrice === undefined) return;

    const triggers = activeTriggers.getTriggersForAsset(asset);
    if (triggers.length === 0) return;

    for (const trigger of triggers) {
      if (!this.evaluateTriggerCondition(trigger.targetPrice, previousPrice, currentPrice)) {
        continue;
      }

      if (!debouncer.shouldFire(trigger.workflowId)) {
        logger.info('Trigger suppressed by debouncer', { workflowId: trigger.workflowId });
        continue;
      }

      logger.info('TRIGGER FIRED', {
        workflowId: trigger.workflowId,
        asset,
        targetPrice: trigger.targetPrice,
        currentPrice,
      });

      WorkflowEngine.execute(trigger.workflowId, trigger.nodeId, {
        asset,
        currentPrice,
        previousPrice,
        targetPrice: trigger.targetPrice,
      }).catch((err) => {
        logger.error('Engine failed to start from trigger', { error: err.message });
      });
    }
  }

  /**
   * Returns true if price has crossed (in either direction) through the target price.
   */
  private evaluateTriggerCondition(
    targetPrice: number,
    previousPrice: number,
    currentPrice: number
  ): boolean {
    const crossedAbove = previousPrice < targetPrice && currentPrice >= targetPrice;
    const crossedBelow = previousPrice > targetPrice && currentPrice <= targetPrice;
    return crossedAbove || crossedBelow;
  }

  disconnect(): void {
    this.ws?.terminate();
    this.ws = null;
    this.isConnected = false;
    this.activeSubscriptions.clear();
    this.lastPrices.clear();
    logger.info('WebSocketManager disconnected');
  }
}

export const wsManager = new WebSocketManager();
