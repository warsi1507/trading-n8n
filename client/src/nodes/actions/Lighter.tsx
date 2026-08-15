import { Handle, Position } from "@xyflow/react";
import { SUPPORTED_ASSETS } from "@/components/TriggerSheet";

export type TradingMetadata = {
    type: "LONG" | "SHORT",
    qty: number,
    symbol: string
}

export function Lighter({ data, isConnectable }: { 
    data: {
        metadata: TradingMetadata
    },
    isConnectable: boolean 
}) {
    return (
        <div>
            Lighter
            <div> {data.metadata.type} </div>
            <div> {data.metadata.qty} </div>
            <div> {data.metadata.symbol} </div>
            <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
            <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
        </div>
    )
}
