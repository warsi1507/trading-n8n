import type { AppNode, NodeMetadata } from "@trading-n8n/common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Trash2 } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import type {
  PriceTriggerMetadata,
  TimeTriggerMetadata,
  TriggerType,
  NodeType,
} from "@trading-n8n/common";
import { SUPPORTED_ASSETS } from "@trading-n8n/common";

interface TriggerSheetProps {
  onSelect: (
    type: NodeType,
    name: string,
    description: string,
    metadata: NodeMetadata,
  ) => void;
  onClose: () => void;
  initialNode?: AppNode;
  onDelete?: () => void;
}

const SUPPORTED_TRIGGERS: {
  id: TriggerType;
  title: string;
  description: string;
}[] = [
  {
    id: "time-trigger",
    title: "Time Trigger",
    description: "Run on a set time interval",
  },
  {
    id: "price-trigger",
    title: "Price Trigger",
    description:
      "Runs whenever the price of an asset goes above or below a certain amount",
  },
];

export function TriggerSheet({
  onSelect,
  onClose,
  initialNode,
  onDelete,
}: TriggerSheetProps) {
  const [metadata, setMetadata] = useState<
    Partial<PriceTriggerMetadata & TimeTriggerMetadata>
  >(
    initialNode
      ? (initialNode.data.metadata as Partial<
          PriceTriggerMetadata & TimeTriggerMetadata
        >)
      : { asset: "" },
  );
  const [selectedTrigger, setSelectedTrigger] = useState<NodeType | undefined>(
    initialNode ? (initialNode.type as NodeType) : undefined,
  );
  const [nodeName, setNodeName] = useState(
    initialNode ? initialNode.data.name : "",
  );
  const [nodeDescription, setNodeDescription] = useState(
    initialNode ? initialNode.data.description : "",
  );

  const [timeStr, setTimeStr] = useState(
    initialNode && initialNode.type === "time-trigger"
      ? (initialNode.data.metadata as TimeTriggerMetadata).time.toString()
      : "",
  );
  const [priceStr, setPriceStr] = useState(
    initialNode && initialNode.type === "price-trigger"
      ? (initialNode.data.metadata as PriceTriggerMetadata).price.toString()
      : "",
  );

  // Validation
  const isNameEmpty = nodeName.trim() === "";
  const isTimeInvalid = timeStr !== "" && !/^\d+$/.test(timeStr);
  const isTimeEmpty = timeStr === "";

  const isPriceInvalid = priceStr !== "" && !/^\d+(\.\d+)?$/.test(priceStr);
  const isPriceEmpty = priceStr === "";

  const isTriggerInvalid =
    isNameEmpty ||
    !selectedTrigger ||
    (selectedTrigger === "time-trigger" && (isTimeEmpty || isTimeInvalid)) ||
    (selectedTrigger === "price-trigger" &&
      (!metadata.asset || isPriceEmpty || isPriceInvalid));

  return (
    <Sheet
      open={true}
      onOpenChange={(open: boolean) => {
        if (!open) onClose();
      }}
    >
      <SheetContent className="flex flex-col sm:max-w-md w-full bg-background/95 backdrop-blur-xl p-8 shadow-2xl border-l-0 max-h-screen">
        <SheetHeader className="text-left space-y-0 mb-8 flex flex-row items-center justify-between gap-4 shrink-0">
          <div className="flex flex-row items-center gap-4">
            <img
              src="/icon-trigger.svg"
              alt="Trigger Icon"
              className="w-12 h-12"
            />
            <div className="flex flex-col">
              <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">
                {initialNode ? "Update Trigger" : "Select Trigger"}
              </SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground/80 leading-relaxed">
                {initialNode
                  ? "Update this trigger node's configuration"
                  : "Select a trigger for your workflow"}
              </SheetDescription>
            </div>
          </div>
          {initialNode && onDelete && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="absolute right-10 top-10 text-red-500 hover:text-red-600 hover:bg-red-500/10 w-10 h-10 rounded-xl transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          )}
        </SheetHeader>
        <div className="flex-1 flex flex-col overflow-y-auto px-2 -mx-2 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Name
              </Label>
              <Input
                value={nodeName}
                onChange={(e) => setNodeName(e.target.value)}
                maxLength={50}
                placeholder="e.g. My Trigger"
                className="h-12 bg-muted/30 border-muted-foreground/20 rounded-xl hover:bg-muted/50 transition-colors focus-visible:ring-4 focus-visible:ring-primary/10 shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">
                Description
              </Label>
              <textarea
                value={nodeDescription}
                onChange={(e) => setNodeDescription(e.target.value)}
                maxLength={200}
                placeholder="Add a description..."
                className="w-full flex min-h-[80px] rounded-xl border border-muted-foreground/20 bg-muted/30 px-3 py-2 text-sm hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 shadow-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>
          </div>
          <Select
            disabled={!!initialNode}
            value={selectedTrigger}
            onValueChange={(val) => setSelectedTrigger(val as NodeType)}
          >
            <SelectTrigger className="w-full h-14 px-4 bg-muted/30 border-muted-foreground/20 rounded-xl hover:bg-muted/50 transition-colors focus:ring-4 focus:ring-primary/10 shadow-sm text-md font-medium [&_[data-description]]:hidden">
              <SelectValue placeholder="Select a Trigger" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-muted-foreground/20 shadow-xl overflow-hidden p-1">
              <SelectGroup>
                {SUPPORTED_TRIGGERS.map(({ id, title, description }) => (
                  <>
                    <SelectItem
                      key={id}
                      value={id}
                      className="cursor-pointer py-4 px-4 rounded-lg my-1 hover:bg-accent/80 focus:bg-accent transition-all duration-200 group"
                    >
                      <div className="flex flex-col items-start gap-1.5">
                        <span className="text-sm font-semibold tracking-tight group-hover:text-primary transition-colors">
                          {title}
                        </span>
                        <span
                          data-description
                          className="text-xs text-muted-foreground/70 font-normal leading-relaxed text-left whitespace-normal break-words max-w-[280px]"
                        >
                          {description}
                        </span>
                      </div>
                    </SelectItem>
                  </>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          {selectedTrigger === "time-trigger" && (
            <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Time Interval (seconds)
                </Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={timeStr}
                  onChange={(e) => setTimeStr(e.target.value)}
                  className={`h-14 px-4 bg-muted/30 border-muted-foreground/20 rounded-xl hover:bg-muted/50 transition-colors focus-visible:ring-4 focus-visible:ring-primary/10 shadow-sm ${isTimeInvalid ? "border-red-500 focus-visible:ring-red-500/20" : ""}`}
                  placeholder="e.g. 3600"
                />
                {isTimeInvalid && (
                  <p className="text-xs text-red-500 mt-1">
                    not a valid time interval
                  </p>
                )}
              </div>
            </div>
          )}

          {selectedTrigger === "price-trigger" && (
            <div className="mt-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Asset
                </Label>
                <Select
                  value={metadata.asset}
                  onValueChange={(value) =>
                    setMetadata({ ...metadata, asset: value })
                  }
                >
                  <SelectTrigger className="w-full h-14 px-4 bg-muted/30 border-muted-foreground/20 rounded-xl hover:bg-muted/50 transition-colors focus:ring-4 focus:ring-primary/10 shadow-sm text-md font-medium">
                    <SelectValue placeholder="Select an asset" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-muted-foreground/20 shadow-xl overflow-hidden p-1">
                    <SelectGroup>
                      {SUPPORTED_ASSETS.map((id: string) => (
                        <SelectItem
                          key={id}
                          value={id}
                          className="cursor-pointer py-4 px-4 rounded-lg my-1 hover:bg-accent/80 focus:bg-accent transition-all duration-200 group"
                        >
                          <span className="text-sm font-semibold tracking-tight group-hover:text-primary transition-colors">
                            {id}
                          </span>
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">
                  Target Price (USD )
                </Label>
                <Input
                  type="text"
                  inputMode="decimal"
                  value={priceStr}
                  onChange={(e) => setPriceStr(e.target.value)}
                  className={`h-14 px-4 bg-muted/30 border-muted-foreground/20 rounded-xl hover:bg-muted/50 transition-colors focus-visible:ring-4 focus-visible:ring-primary/10 shadow-sm ${isPriceInvalid ? "border-red-500 focus-visible:ring-red-500/20" : ""}`}
                  placeholder="e.g. 60000.50"
                />
                {isPriceInvalid && (
                  <p className="text-xs text-red-500 mt-1">
                    not a valid positive price
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
        <SheetFooter className="mt-auto pt-6 border-t border-border/40 grid grid-cols-2 gap-3 sm:space-x-0">
          <Button
            onClick={() => {
              const finalMetadata = { ...metadata };
              if (selectedTrigger === "time-trigger")
                finalMetadata.time = parseInt(timeStr);
              if (selectedTrigger === "price-trigger")
                finalMetadata.price = parseFloat(priceStr);

              onSelect(
                selectedTrigger as NodeType,
                nodeName,
                nodeDescription,
                finalMetadata as NodeMetadata,
              );
            }}
            disabled={isTriggerInvalid}
            type="submit"
            className="w-full h-12 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 order-2"
          >
            {initialNode ? "Save Changes" : "Create"}
          </Button>
          <SheetClose asChild>
            <Button
              variant="outline"
              className="w-full h-12 rounded-xl font-medium border-muted-foreground/30 hover:bg-muted/50 transition-all order-1"
            >
              Cancel
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
