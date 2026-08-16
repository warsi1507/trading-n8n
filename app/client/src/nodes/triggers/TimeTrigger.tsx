import type { TimeTriggerMetadata } from "@trading-n8n/common";
import { BaseNode } from "../BaseNode";

export function TimeTrigger({
  data,
  isConnectable,
}: {
  data: {
    name: string;
    description: string;
    kind: "action" | "trigger";
    metadata: TimeTriggerMetadata;
  };
  isConnectable?: boolean;
}) {
  return (
    <BaseNode
      name={data.name}
      description={data.description}
      logo={
        <img
          src="/icon-trigger.svg"
          alt="Time Trigger"
          className="w-8 h-8 opacity-80"
        />
      }
      tags={["Time Trigger", `${data.metadata.time} secs`]}
      isConnectable={isConnectable ?? true}
      kind={data.kind}
    />
  );
}
