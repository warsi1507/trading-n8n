import type { PriceTriggerMetadata } from "@trading-n8n/common";
import { BaseNode } from "../BaseNode";

export function PriceTrigger({
  data,
  isConnectable,
}: {
  data: {
    name: string;
    description: string;
    kind: "action" | "trigger";
    metadata: PriceTriggerMetadata;
  };
  isConnectable: boolean;
}) {
  return (
    <BaseNode
      name={data.name}
      description={data.description}
      logo={
        <img
          src="/icon-trigger.svg"
          alt="Price Trigger"
          className="w-8 h-8 opacity-80"
        />
      }
      tags={["Price Trigger", data.metadata?.asset || "Any", `$${data.metadata?.price || "0"}`]}
      isConnectable={isConnectable}
      kind={data.kind}
    />
  );
}
