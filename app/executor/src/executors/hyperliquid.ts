import { Hyperliquid } from 'hyperliquid';
import { createLogger } from '@trading-n8n/logger';
import type { TradeOrder, TradeResult } from './types';
import type { SupportedAsset } from '@trading-n8n/common';

const logger = createLogger('HYPERLIQUID');

/**
 * Maps our internal asset names to Hyperliquid's perpetual coin names.
 */
const COIN_MAP: Record<SupportedAsset, string> = {
  BTC: 'BTC',
  ETH: 'ETH',
  SOL: 'SOL',
};

/**
 * Places an Immediate-Or-Cancel (IOC) limit order on Hyperliquid.
 * Fetches the current mid-price and applies 1% slippage to ensure fill.
 *
 * Credentials required:
 *   PRIVATE_KEY - The EVM wallet private key (0x... format) used as the Hyperliquid API wallet
 */
export async function execute(
  order: TradeOrder,
  credentials: Record<string, string>
): Promise<TradeResult> {
  const { asset, qty, type } = order;
  const coin = COIN_MAP[asset];

  // Matches ActionSheet PLATFORM_CONFIG labels: { label: "Master Address" }, { label: "Agent Private Key" }
  const privateKey = credentials['Agent Private Key'];
  if (!privateKey) {
    throw new Error('Hyperliquid executor requires an "Agent Private Key" credential');
  }

  const sdk = new Hyperliquid({
    privateKey,
    enableWs: false,
  });

  // getAllMids returns { [coinName]: midPriceString }
  const mids = await sdk.info.getAllMids();
  const midPriceStr = mids[coin];
  if (!midPriceStr) {
    throw new Error(`No mid-price found for ${coin} on Hyperliquid`);
  }

  const midPrice = parseFloat(midPriceStr);
  const limitPrice = type === 'LONG' ? midPrice * 1.01 : midPrice * 0.99;
  const roundedPrice = parseFloat(limitPrice.toFixed(4));

  // Hyperliquid SDK uses snake_case for the OrderRequest interface
  const result = await sdk.exchange.placeOrder({
    coin,
    is_buy: type === 'LONG',
    sz: qty,
    limit_px: roundedPrice,
    order_type: { limit: { tif: 'Ioc' } },
    reduce_only: false,
  });

  const orderId = result?.response?.data?.statuses?.[0]?.resting?.oid?.toString();

  logger.info('Hyperliquid order placed', {
    coin,
    type,
    qty,
    limitPrice: roundedPrice,
    orderId,
  });

  return {
    success: true,
    platform: 'Hyperliquid',
    asset,
    type,
    qty,
    orderId,
    filledPrice: roundedPrice,
  };
}
