import type { NodeType, NodeMetadata } from "./CreateWorkflow";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useState } from "react";
import type { PriceTriggerMetadata } from "@/nodes/triggers/PriceTrigger";
import type { TimeTriggerMetadata } from "@/nodes/triggers/TimeTrigger";


interface TriggerSheetProps {
    onSelect: (type: NodeType, metadata: NodeMetadata) => void;
    onClose: () => void;
}


const SUPPORTED_TRIGGERS = [
{
    id: "time-trigger",
    title: "Time Trigger",
    description: "Run on a set time interval"
},
{
    id: "price-trigger",
    title: "Price Trigger",
    description: "Runs whenever the price of an asset goes above or below a certain amount"
}
];

const SUPPORTED_ASSET = ["SOL", "BTC", "ETH"];

export function TriggerSheet ( { onSelect, onClose } : TriggerSheetProps )
{
    const [metadata, setMetadata] = useState<Partial<PriceTriggerMetadata & TimeTriggerMetadata>>({
        asset: "",
        price: 0,
        time: 0
    });
    const [selectedTrigger, setSelectedTrigger] = useState<NodeType | undefined>();

    return (
        <Sheet open={true} onOpenChange={(open) => { if (!open) onClose(); }}>
        <SheetContent className="flex flex-col sm:max-w-md w-full bg-background/95 backdrop-blur-xl p-8 shadow-2xl border-l-0">
            <SheetHeader className="text-left space-y-2 mb-8">
            <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">Select Trigger</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground/80 leading-relaxed">
                select a trigger for your workflow
            </SheetDescription>
            </SheetHeader>
            <div className="flex-1 flex flex-col">
              <Select value={selectedTrigger} onValueChange={(val) => setSelectedTrigger(val as NodeType)}>
              <SelectTrigger className="w-full h-14 px-4 bg-muted/30 border-muted-foreground/20 rounded-xl hover:bg-muted/50 transition-colors focus:ring-4 focus:ring-primary/10 shadow-sm text-md font-medium [&_[data-description]]:hidden">
                  <SelectValue placeholder="Select a Trigger" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-muted-foreground/20 shadow-xl overflow-hidden p-1">
                  <SelectGroup>
                  {SUPPORTED_TRIGGERS.map(({id, title, description}) => ( <>
                      <SelectItem 
                          key={id} 
                          value={id} 
                          className="cursor-pointer py-4 px-4 rounded-lg my-1 hover:bg-accent/80 focus:bg-accent transition-all duration-200 group" 
                          >
                          <div className="flex flex-col items-start gap-1.5">
                              <span className="text-sm font-semibold tracking-tight group-hover:text-primary transition-colors">{title}</span>
                              <span data-description className="text-xs text-muted-foreground/70 font-normal leading-relaxed text-left whitespace-normal break-words max-w-[280px]">
                                {description}
                              </span>
                          </div>
                      </SelectItem>
                  </>))}
                  </SelectGroup>
              </SelectContent>
              </Select>

              {selectedTrigger === "time-trigger" && (
                <div className="mt-6 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Time Interval (seconds)</Label>
                        <Input 
                            type="number" 
                            value={metadata.time || ""} 
                            onChange={(e) => setMetadata({ ...metadata, time: parseFloat(e.target.value) || 0 })}
                            className="h-14 px-4 bg-muted/30 border-muted-foreground/20 rounded-xl hover:bg-muted/50 transition-colors focus-visible:ring-4 focus-visible:ring-primary/10 shadow-sm"
                            placeholder="e.g. 3600"
                        />
                    </div>
                </div>
              )}

              {selectedTrigger === "price-trigger" && (
                <div className="mt-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300"> 
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Asset</Label>
                        <Select value={metadata.asset} onValueChange={(value) => setMetadata({ ...metadata, asset: value })}>
                            <SelectTrigger className="w-full h-14 px-4 bg-muted/30 border-muted-foreground/20 rounded-xl hover:bg-muted/50 transition-colors focus:ring-4 focus:ring-primary/10 shadow-sm text-md font-medium">
                                <SelectValue placeholder="Select an asset" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-muted-foreground/20 shadow-xl overflow-hidden p-1">
                                <SelectGroup>
                                    {SUPPORTED_ASSET.map((id) => (
                                        <SelectItem key={id} value={id} className="cursor-pointer py-4 px-4 rounded-lg my-1 hover:bg-accent/80 focus:bg-accent transition-all duration-200 group">
                                            <span className="text-sm font-semibold tracking-tight group-hover:text-primary transition-colors">{id}</span>
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Target Price (USD)</Label>
                        <Input 
                            type="number" 
                            value={metadata.price || ""} 
                            onChange={(e) => setMetadata({ ...metadata, price: parseFloat(e.target.value) || 0 })}
                            className="h-14 px-4 bg-muted/30 border-muted-foreground/20 rounded-xl hover:bg-muted/50 transition-colors focus-visible:ring-4 focus-visible:ring-primary/10 shadow-sm"
                            placeholder="e.g. 60000"
                        />
                    </div>
                </div>
              )}
            </div>
            <SheetFooter className="mt-auto pt-6 border-t border-border/40 grid grid-cols-2 gap-3 sm:space-x-0">
              <Button 
                onClick={() => {
                    onSelect(
                        selectedTrigger as NodeType,
                        metadata
                    )
                }}
                type="submit" 
                className="w-full h-12 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 order-2"
                >
                Save changes
              </Button>
              <SheetClose asChild>
                <Button variant="outline" className="w-full h-12 rounded-xl font-medium border-muted-foreground/30 hover:bg-muted/50 transition-all order-1">Close</Button>
              </SheetClose>
            </SheetFooter>
        </SheetContent>
        </Sheet>
    )
}