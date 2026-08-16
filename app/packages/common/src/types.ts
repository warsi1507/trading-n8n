export type TriggerType = "price-trigger" | "time-trigger";
export type ActionType = "hyperliquid" | "backpack" | "lighter";
export type NodeType = TriggerType | ActionType;

export const SUPPORTED_ASSETS = ["SOL", "BTC", "ETH"] as const;
export type SupportedAsset = (typeof SUPPORTED_ASSETS)[number];

export type OrderType = "LONG" | "SHORT";
