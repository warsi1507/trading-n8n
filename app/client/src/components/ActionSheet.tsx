import type { NodeMetadata, AppNode } from "./CreateWorkflow";
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2 } from "lucide-react"
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
import { SUPPORTED_ASSETS } from "@trading-n8n/common";
import type { TradingMetadata, ActionType, NodeType } from "@trading-n8n/common";

interface ActionSheetProps {
    onSelect: (type: NodeType, name: string, description: string, metadata: NodeMetadata) => void;
    onClose: () => void;
    initialNode?: AppNode;
    onDelete?: () => void;
}

export const SUPPORTED_ACTIONS: { id: ActionType, title: string, description: string }[] = [
{
    id: "hyperliquid",
    title: "Hyperliquid",
    description: "Execute trades on Hyperliquid DEX"
},
{
    id: "lighter",
    title: "Lighter",
    description: "Execute trades on Lighter DEX"
},
{
    id: "backpack",
    title: "Backpack",
    description: "Execute trades on Backpack Exchange"
}
];

export function ActionSheet ( { onSelect, onClose, initialNode, onDelete } : ActionSheetProps )
{
    const [metadata, setMetadata] = useState<Partial<TradingMetadata>>(initialNode ? initialNode.data.metadata as Partial<TradingMetadata> : {});
    const [selectedAction, setSelectedAction] = useState<NodeType | undefined>(initialNode ? initialNode.type as NodeType : undefined);
    const [nodeName, setNodeName] = useState(initialNode ? initialNode.data.name : "");
    const [nodeDescription, setNodeDescription] = useState(initialNode ? initialNode.data.description : "");
    
    const [qtyStr, setQtyStr] = useState(initialNode && (initialNode.data.metadata as TradingMetadata).qty ? (initialNode.data.metadata as TradingMetadata).qty.toString() : "");

    // Validation
    const isNameEmpty = nodeName.trim() === "";
    const isQtyInvalid = qtyStr !== "" && !/^\d+(\.\d+)?$/.test(qtyStr);
    const isQtyEmpty = qtyStr === "";
    const isActionInvalid = isNameEmpty || !selectedAction || !metadata.symbol || !metadata.type || isQtyEmpty || isQtyInvalid;

    return (
        <Sheet open={true} onOpenChange={(open: boolean) => { if (!open) onClose(); }}>
        <SheetContent className="flex flex-col sm:max-w-md w-full bg-background/95 backdrop-blur-xl p-8 shadow-2xl border-l-0 max-h-screen">
            <SheetHeader className="text-left space-y-0 mb-8 flex flex-row items-center justify-between gap-4 shrink-0">
                <div className="flex flex-row items-center gap-4">
                    <img src="/icon-action.svg" alt="Action Icon" className="w-12 h-12" />
                    <div className="flex flex-col">
                        <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">{initialNode ? "Update Action" : "Select Action"}</SheetTitle>
                        <SheetDescription className="text-sm text-muted-foreground/80 leading-relaxed">
                            {initialNode ? "Update this action node's configuration" : "Select an action to perform"}
                        </SheetDescription>
                    </div>
                </div>
                {initialNode && onDelete && (
                    <Button variant="ghost" size="icon" onClick={onDelete} className="absolute right-10 top-10 text-red-500 hover:text-red-600 hover:bg-red-500/10 w-10 h-10 rounded-xl transition-colors">
                        <Trash2 className="w-5 h-5" />
                    </Button>
                )}
            </SheetHeader>
            <div className="flex-1 flex flex-col overflow-y-auto px-2 -mx-2 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                <div className="space-y-4 mb-6">
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Name</Label>
                        <Input 
                            value={nodeName} 
                            onChange={e => setNodeName(e.target.value)} 
                            maxLength={50} 
                            placeholder="e.g. My Action"
                            className="h-12 bg-muted/30 border-muted-foreground/20 rounded-xl hover:bg-muted/50 transition-colors focus-visible:ring-4 focus-visible:ring-primary/10 shadow-sm"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Description</Label>
                        <textarea 
                            value={nodeDescription} 
                            onChange={e => setNodeDescription(e.target.value)} 
                            maxLength={200}
                            placeholder="Add a description..."
                            className="w-full flex min-h-[80px] rounded-xl border border-muted-foreground/20 bg-muted/30 px-3 py-2 text-sm hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/10 shadow-sm placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                        />
                    </div>
                </div>
              <Select disabled={!!initialNode} value={selectedAction} onValueChange={(val) => setSelectedAction(val as NodeType)}>
              <SelectTrigger className="w-full h-14 px-4 bg-muted/30 border-muted-foreground/20 rounded-xl hover:bg-muted/50 transition-colors focus:ring-4 focus:ring-primary/10 shadow-sm text-md font-medium [&_[data-description]]:hidden">
                  <SelectValue placeholder="Select an Action" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-muted-foreground/20 shadow-xl overflow-hidden p-1">
                  <SelectGroup>
                  {SUPPORTED_ACTIONS.map(({id, title, description}) => (
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
                  ))}
                  </SelectGroup>
              </SelectContent>
              </Select>
              
              {(selectedAction === "hyperliquid" || selectedAction === "lighter" || selectedAction === "backpack") && (
                <div className="mt-6 space-y-5 animate-in fade-in slide-in-from-bottom-2 duration-300"> 
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Asset</Label>
                        <Select value={metadata.symbol} onValueChange={(value) => setMetadata({ ...metadata, symbol: value })}>
                            <SelectTrigger className="w-full h-14 px-4 bg-muted/30 border-muted-foreground/20 rounded-xl hover:bg-muted/50 transition-colors focus:ring-4 focus:ring-primary/10 shadow-sm text-md font-medium">
                                <SelectValue placeholder="Select an asset" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-muted-foreground/20 shadow-xl overflow-hidden p-1">
                                <SelectGroup>
                                    {SUPPORTED_ASSETS.map((id: string) => (
                                        <SelectItem key={id} value={id} className="cursor-pointer py-4 px-4 rounded-lg my-1 hover:bg-accent/80 focus:bg-accent transition-all duration-200 group">
                                            <span className="text-sm font-semibold tracking-tight group-hover:text-primary transition-colors">{id}</span>
                                        </SelectItem>
                                    ))}
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Order Type</Label>
                        <Select value={metadata.type} onValueChange={(value: "LONG" | "SHORT") => setMetadata({ ...metadata, type: value })}>
                            <SelectTrigger className="w-full h-14 px-4 bg-muted/30 border-muted-foreground/20 rounded-xl hover:bg-muted/50 transition-colors focus:ring-4 focus:ring-primary/10 shadow-sm text-md font-medium">
                                <SelectValue placeholder="Select order type" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-muted-foreground/20 shadow-xl overflow-hidden p-1">
                                <SelectGroup>
                                    <SelectItem value="LONG" className="cursor-pointer py-4 px-4 rounded-lg my-1 hover:bg-accent/80 focus:bg-accent transition-all duration-200 group">
                                        <span className="text-sm font-semibold tracking-tight group-hover:text-primary transition-colors">LONG</span>
                                    </SelectItem>
                                    <SelectItem value="SHORT" className="cursor-pointer py-4 px-4 rounded-lg my-1 hover:bg-accent/80 focus:bg-accent transition-all duration-200 group">
                                        <span className="text-sm font-semibold tracking-tight group-hover:text-primary transition-colors">SHORT</span>
                                    </SelectItem>
                                </SelectGroup>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Quantity</Label>
                        <Input 
                            type="text"
                            inputMode="decimal"
                            value={qtyStr} 
                            onChange={(e) => setQtyStr(e.target.value)}
                            className={`h-14 px-4 bg-muted/30 border-muted-foreground/20 rounded-xl hover:bg-muted/50 transition-colors focus-visible:ring-4 focus-visible:ring-primary/10 shadow-sm ${isQtyInvalid ? "border-red-500 focus-visible:ring-red-500/20" : ""}`}
                            placeholder="e.g. 1.5"
                        />
                        {isQtyInvalid && <p className="text-xs text-red-500 mt-1">not a valid positive quantity</p>}
                    </div>
                </div>
              )}
            </div>

            <SheetFooter className="mt-auto pt-6 border-t border-border/40 grid grid-cols-2 gap-3 sm:space-x-0">
              <Button 
                onClick={() => {
                    onSelect(
                        selectedAction as NodeType,
                        nodeName,
                        nodeDescription,
                        { ...metadata, qty: parseFloat(qtyStr) } as NodeMetadata
                    )
                }}
                disabled={isActionInvalid}
                type="submit" 
                className="w-full h-12 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 order-2"
                >
                {initialNode ? "Save Changes" : "Create"}
              </Button>
              <SheetClose asChild>
                <Button variant="outline" className="w-full h-12 rounded-xl font-medium border-muted-foreground/30 hover:bg-muted/50 transition-all order-1">Cancel</Button>
              </SheetClose>
            </SheetFooter>
        </SheetContent>
        </Sheet>
    )
}
