export type TriggerType = "price-trigger" | "time-trigger";
export type ActionType = "hyperliquid" | "backpack" | "lighter";
export type NodeType = TriggerType | ActionType;
export declare const SUPPORTED_ASSETS: readonly ["SOL", "BTC", "ETH"];
export type SupportedAsset = (typeof SUPPORTED_ASSETS)[number];
export type OrderType = "LONG" | "SHORT";
