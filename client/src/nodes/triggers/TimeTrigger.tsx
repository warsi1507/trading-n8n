import { Handle, Position } from "@xyflow/react";

export interface TimeTriggerMetadata {
    asset: string;
    time: number;
}

export function TimeTrigger({ data, isConnectable }: { 
    data: {
        metadata: TimeTriggerMetadata 
    },
    isConnectable: boolean
}) {
    return (
        <div>
            {data.metadata.time} seconds
            <Handle type="source" position={Position.Right} ></Handle>
        </div>
    )
}