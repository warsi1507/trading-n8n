import { Handle, Position } from "@xyflow/react";

interface BaseNodeProps {
  name: string;
  description: string;
  logo: React.ReactNode;
  tags: string[];
  isConnectable: boolean;
  kind: "trigger" | "action";
}

export function BaseNode({
  name,
  description,
  logo,
  tags,
  isConnectable,
  kind,
}: BaseNodeProps) {
  return (
    <div className="w-[260px] bg-card dark:bg-card/95 rounded-2xl border border-border shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-primary/40 group">
      {kind === "action" && (
        <Handle
          type="target"
          position={Position.Left}
          isConnectable={isConnectable}
          isConnectableStart={false}
          className="w-3.5 h-3.5 bg-background dark:bg-background border-2 border-muted-foreground/40 dark:border-muted-foreground/60"
        />
      )}

      <div className="p-3 flex gap-3 border-b border-border/50 bg-muted/5 dark:bg-muted/10">
        <div className="w-8 h-8 shrink-0 flex items-center justify-center">
          {logo}
        </div>
        <div className="flex flex-col min-w-0 justify-center">
          <h3 className="font-semibold text-sm text-foreground truncate">
            {name || "Unnamed Node"}
          </h3>
          <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5 leading-snug">
            {description || "No description provided."}
          </p>
        </div>
      </div>

      {tags.length > 0 && (
        <div className="p-3 flex flex-wrap gap-1.5 bg-background dark:bg-background/50">
          {tags.map((tag, i) => (
            <div
              key={i}
              className="inline-flex items-center rounded-md border border-border/50 bg-muted/40 dark:bg-muted/30 px-2 py-0.5 text-[10px] font-medium text-foreground transition-colors hover:bg-muted/60 dark:hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              {tag}
            </div>
          ))}
        </div>
      )}

      <Handle
        type="source"
        position={Position.Right}
        isConnectable={isConnectable}
        className="w-3.5 h-3.5 bg-background dark:bg-background border-2 border-muted-foreground/40 dark:border-muted-foreground/60"
      />
    </div>
  );
}
