import { Handle, Position } from "@xyflow/react";
import type { TimeTriggerMetadata } from "@trading-n8n/common";

export function TimeTrigger({ data }: { 
    data: {
        metadata: TimeTriggerMetadata 
    }
}) {
    return (
        <div>
            {data.metadata.time} seconds
            <Handle type="source" position={Position.Right} ></Handle>
        </div>
    )
}