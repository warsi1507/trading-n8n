import axios from 'axios';
import * as nacl from 'tweetnacl';
import { createLogger } from '@trading-n8n/logger';
import type { TradeOrder, TradeResult } from './types';
import type { SupportedAsset } from '@trading-n8n/common';

const logger = createLogger('BACKPACK');

const BASE_URL = 'https://api.backpack.exchange';
const WINDOW = 5000;

/**
 * Maps our internal asset names to Backpack's trading pair format (spot pairs with USDC).
 */
const SYMBOL_MAP: Record<SupportedAsset, string> = {
  BTC: 'BTC_USDC',
  ETH: 'ETH_USDC',
  SOL: 'SOL_USDC',
};

/**
 * Builds the canonical instruction string required for Backpack request signing.
 * Params must be sorted alphabetically per the Backpack API specification.
 */
function buildInstruction(instruction: string, params: Record<string, string>): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join('&');
  return `instruction=${instruction}&${sorted}`;
}

/**
 * Signs a message string using ED25519 with the given base64-encoded private key.
 * Returns the base64-encoded signature.
 */
function signMessage(message: string, base64PrivateKey: string): string {
  const privateKeyBytes = Buffer.from(base64PrivateKey, 'base64');
  const messageBytes = Buffer.from(message, 'utf-8');
  const signature = nacl.sign.detached(messageBytes, privateKeyBytes);
  return Buffer.from(signature).toString('base64');
}

/**
 * Fetches the latest trade price for a symbol from the Backpack ticker endpoint.
 */
async function getLatestPrice(symbol: string): Promise<number> {
  const response = await axios.get(`${BASE_URL}/api/v1/ticker`, {
    params: { symbol },
  });
  const price = parseFloat(response.data.lastPrice);
  if (!price || isNaN(price)) {
    throw new Error(`Could not get a valid price for ${symbol} from Backpack`);
  }
  return price;
}

/**
 * Places an Immediate-Or-Cancel (IOC) limit order on Backpack Exchange.
 * Adds 1% slippage on LONG orders and subtracts 1% on SHORT orders to ensure fill.
 *
 * Credentials required:
 *   API_KEY    - Base64 encoded ED25519 public key
 *   API_SECRET - Base64 encoded ED25519 private key (64 bytes)
 */
export async function execute(
  order: TradeOrder,
  credentials: Record<string, string>
): Promise<TradeResult> {
  const { asset, qty, type } = order;
  const symbol = SYMBOL_MAP[asset];

  // Matches ActionSheet PLATFORM_CONFIG labels: { label: "API Key" }, { label: "API Secret" }
  const apiKey    = credentials['API Key'];
  const apiSecret = credentials['API Secret'];

  if (!apiKey || !apiSecret) {
    throw new Error('Backpack executor requires "API Key" and "API Secret" credentials');
  }

  const latestPrice = await getLatestPrice(symbol);
  const limitPrice = type === 'LONG' ? latestPrice * 1.01 : latestPrice * 0.99;
  const priceStr = limitPrice.toFixed(2);
  const qtyStr = qty.toFixed(4);
  const side = type === 'LONG' ? 'Bid' : 'Ask';
  const timestamp = Date.now().toString();

  // Body params — these are what get sent in the POST body AND sorted into the signature string
  const bodyParams: Record<string, string> = {
    orderType: 'Limit',
    price: priceStr,
    quantity: qtyStr,
    side,
    symbol,
    timeInForce: 'IOC',
  };

  // Per Backpack docs: signature = instruction=orderExecute&<sorted body params>&timestamp=<ts>&window=<window>
  const sigParams = { ...bodyParams, timestamp, window: WINDOW.toString() };
  const instructionStr = buildInstruction('orderExecute', sigParams);
  const signature = signMessage(instructionStr, apiSecret);

  const response = await axios.post(
    `${BASE_URL}/api/v1/order`,
    bodyParams,
    {
      headers: {
        'X-API-Key': apiKey,
        'X-Signature': signature,
        'X-Timestamp': timestamp,
        'X-Window': WINDOW.toString(),
        'Content-Type': 'application/json',
      },
    }
  );

  logger.info('Backpack order placed', {
    symbol,
    type,
    qty,
    limitPrice: priceStr,
    orderId: response.data?.id,
  });

  return {
    success: true,
    platform: 'Backpack',
    asset,
    type,
    qty,
    orderId: response.data?.id,
    filledPrice: limitPrice,
  };
}
