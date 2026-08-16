import type { PriceTriggerMetadata, TimeTriggerMetadata, TradingMetadata } from './metadata';
export type NodeMetadata = PriceTriggerMetadata | TimeTriggerMetadata | TradingMetadata;
export type NodeData = {
    name: string;
    description: string;
    kind: "action" | "trigger";
    metadata: NodeMetadata;
};
export type AppNode = {
    id: string;
    type?: string;
    position: {
        x: number;
        y: number;
    };
    data: NodeData;
    [key: string]: any;
};
