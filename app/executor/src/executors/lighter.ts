import { createLogger } from '@trading-n8n/logger';
import type { TradeOrder, TradeResult } from './types';
import type { SupportedAsset } from '@trading-n8n/common';

const logger = createLogger('LIGHTER');

/**
 * Market configuration for Lighter.xyz perpetual markets.
 * Values from the official Lighter API docs:
 * https://apidocs.lighter.xyz/reference/orderbooks
 */
const MARKETS: Record<SupportedAsset, { marketId: number; qtyDecimals: number; priceDecimals: number }> = {
  ETH: { marketId: 0, qtyDecimals: 10000,  priceDecimals: 100  },
  BTC: { marketId: 1, qtyDecimals: 100000, priceDecimals: 10   },
  SOL: { marketId: 2, qtyDecimals: 1000,   priceDecimals: 1000 },
};

const BASE_URL = 'https://mainnet.zklighter.elliot.ai';

/**
 * Places an Immediate-Or-Cancel (IOC) limit order on Lighter.xyz.
 * Fetches latest candlestick close price, applies 1% slippage, places the order.
 *
 * Credentials required:
 *   PRIVATE_KEY   - EVM wallet private key (0x...) registered as API key on Lighter
 *   ACCOUNT_INDEX - Numeric index of your Lighter account (usually "0")
 *   API_KEY_INDEX - Index of the API key slot used (usually "0")
 */
export async function execute(
  order: TradeOrder,
  credentials: Record<string, string>
): Promise<TradeResult> {
  const { asset, qty, type } = order;
  const market = MARKETS[asset];

  // Matches ActionSheet PLATFORM_CONFIG labels: "Account Index", "API Key Index", "API Private Key"
  const privateKey   = credentials['API Private Key'];
  const accountIndex = parseInt(credentials['Account Index'] ?? '0', 10);
  const apiKeyIndex  = parseInt(credentials['API Key Index'] ?? '0', 10);

  if (!privateKey) {
    throw new Error('Lighter executor requires an "API Private Key" credential');
  }

  const {
    SignerClient,
    CandlestickApi,
    ApiClient,
  } = await import('@specialjp/lighter-sdk');

  // ApiClient already defaults to the Lighter mainnet URL
  const apiClient = new ApiClient();
  const candleApi = new CandlestickApi(apiClient);

  const now = Math.floor(Date.now() / 1000);
  const candleData = await candleApi.getCandlesticks({
    market_id:       market.marketId,
    resolution:      '1m',
    start_timestamp: now - 5 * 60,
    end_timestamp:   now,
    count_back:      1,
  });

  const latestCandle = candleData.candlesticks?.[candleData.candlesticks.length - 1];
  if (!latestCandle?.close) {
    throw new Error(`No candlestick data found for ${asset} on Lighter`);
  }

  const latestPrice: number = latestCandle.close;
  const slippagePrice = type === 'LONG' ? latestPrice * 1.01 : latestPrice * 0.99;

  const baseAmount  = Math.round(qty * market.qtyDecimals);
  const priceUnits  = Math.floor(slippagePrice * market.priceDecimals);
  const isAsk       = type === 'SHORT';

  const client = new SignerClient({
    url: BASE_URL,
    privateKey,
    apiKeyIndex,
    accountIndex,
  });

  await client.createOrder({
    marketIndex:      market.marketId,
    clientOrderIndex: Date.now() % 1_000_000,
    baseAmount,
    price:            priceUnits,
    isAsk,
    orderType:        SignerClient.ORDER_TYPE_LIMIT,
    timeInForce:      SignerClient.ORDER_TIME_IN_FORCE_IMMEDIATE_OR_CANCEL,
    reduceOnly:       false,
    triggerPrice:     SignerClient.NIL_TRIGGER_PRICE,
    orderExpiry:      SignerClient.DEFAULT_IOC_EXPIRY,
  });

  logger.info('Lighter order placed', {
    asset,
    type,
    qty,
    slippagePrice,
    marketId: market.marketId,
  });

  return {
    success:     true,
    platform:    'Lighter.xyz',
    asset,
    type,
    qty,
    filledPrice: slippagePrice,
  };
}
