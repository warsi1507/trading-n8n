import { Handle, Position } from "@xyflow/react";

export interface PriceTriggerMetadata {
    asset: string;
    price: number;
}

export function PriceTrigger({ data, isConnectable }: { 
    data: {
        metadata: PriceTriggerMetadata 
    },
    isConnectable: boolean
}) {
    return (
        <div>
            <div>{data.metadata.asset} @ {data.metadata.price}</div>
            <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
        </div>
    )
}