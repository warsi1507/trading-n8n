import type { Nodekind, NodeMetadata } from "./CreateWorkflow";
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { SelectLabel } from "@radix-ui/react-select";
import { useState } from "react";


interface TriggerSheetProps {
    onSelect: (kind: Nodekind, metadata: NodeMetadata) => void;
}


const SUPPORTED_TRIGGERS = [
{
    id: "timer",
    title: "Timer",
    description: "Run on a set time interval"
},
{
    id: "price-trigger",
    title: "Price Trigger",
    description: "Runs whenever the price of ana asset goes above or below a certain amount"
}
]

export function TriggerSheet ( { onSelect } : TriggerSheetProps )
{
    const [metadata, setMetadata] = useState({});
    return (
        <Sheet open={true}>
        <SheetContent className="flex flex-col sm:max-w-md w-full bg-background/95 backdrop-blur-xl p-8 shadow-2xl border-l-0">
            <SheetHeader className="text-left space-y-2 mb-8">
            <SheetTitle className="text-2xl font-bold tracking-tight text-foreground">Select Trigger</SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground/80 leading-relaxed">
                select the type of trigger for the workflow
            </SheetDescription>
            </SheetHeader>
            <div className="flex-1 flex flex-col">
              <Select>
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
                          onSelect={() => onSelect(id,metadata)}
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
            </div>
            <SheetFooter className="mt-auto pt-6 border-t border-border/40 grid grid-cols-2 gap-3 sm:space-x-0">
              <Button type="submit" className="w-full h-12 rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-200 order-2">Save changes</Button>
              <SheetClose>
                <Button variant="outline" className="w-full h-12 rounded-xl font-medium border-muted-foreground/30 hover:bg-muted/50 transition-all order-1">Close</Button>
              </SheetClose>
            </SheetFooter>
        </SheetContent>
        </Sheet>
    )
}