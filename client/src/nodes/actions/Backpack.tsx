import { Handle, Position } from "@xyflow/react";
import type { TradingMetadata } from "./Lighter";

export function Backpack({ data, isConnectable }: { 
    data: {
        metadata: TradingMetadata
    },
    isConnectable: boolean 
}) {
    return (
        <div>
            Backpack
            <div> {data.metadata.type} </div>
            <div> {data.metadata.qty} </div>
            <div> {data.metadata.symbol} </div>
            <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
            <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
        </div>
    )
}
