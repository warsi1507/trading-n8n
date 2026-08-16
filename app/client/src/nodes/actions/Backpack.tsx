import type { TradingMetadata } from "@trading-n8n/common";
import { BaseNode } from "../BaseNode";

export function Backpack({
  data,
  isConnectable,
}: {
  data: {
    name: string;
    description: string;
    kind: "action" | "trigger";
    metadata: TradingMetadata;
  };
  isConnectable: boolean;
}) {
  return (
    <BaseNode
      name={data.name}
      description={data.description}
      logo={
        <img
          src="/icon-action.svg"
          alt="Backpack"
          className="w-8 h-8 opacity-80"
        />
      }
      tags={[
        "Backpack",
        data.metadata.type,
        `${data.metadata.qty} ${data.metadata.symbol}`,
      ]}
      isConnectable={isConnectable}
      kind={data.kind}
    />
  );
}
