import type { SupportedAsset, OrderType } from '@trading-n8n/common';

export interface TradeOrder {
  asset: SupportedAsset;
  qty: number;
  type: OrderType;
}

export interface TradeResult {
  success: boolean;
  platform: string;
  asset: string;
  type: OrderType;
  qty: number;
  orderId?: string;
  filledPrice?: number;
  message?: string;
}
