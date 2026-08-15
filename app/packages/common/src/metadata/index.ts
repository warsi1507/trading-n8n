export interface PriceTriggerMetadata {
    asset: string;
    price: number;
}

export interface TimeTriggerMetadata {
    asset: string;
    time: number;
}

export type TradingMetadata = {
    type: "LONG" | "SHORT",
    qty: number,
    symbol: string
}
