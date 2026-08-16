import { useState } from "react";
import { Plus, Play } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type WorkflowStatus = "in-progress" | "deployed";

interface Workflow {
  id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  active: boolean;
}

const mockWorkflows: Workflow[] = [
  { id: 'workflow-123', name: 'MACD Crossover', description: 'Buys SOL on 15m MACD bullish crossover and sells on bearish. Very tight stop loss.', status: 'in-progress', active: false },
  { id: 'workflow-234', name: 'RSI Reversal', description: 'Shorts BTC when RSI > 75 on 1H timeframe. Requires strict stop loss and take profit.', status: 'deployed', active: true },
  { id: 'workflow-345', name: 'Grid Bot', description: 'Simple grid bot for ETH/USDC ranging between $2000-$3000. Rebalances every 1 hour.', status: 'deployed', active: false },
];

export default function Workflows() {
  const navigate = useNavigate();
  const [workflows, setWorkflows] = useState<Workflow[]>(mockWorkflows);
  const [toggleWorkflow, setToggleWorkflow] = useState<Workflow | null>(null);

  const inProgress = workflows.filter(w => w.status === 'in-progress');
  const deployed = workflows.filter(w => w.status === 'deployed');

  const handleToggle = () => {
    if (toggleWorkflow) {
      setWorkflows(prev => prev.map(w => w.id === toggleWorkflow.id ? { ...w, active: !w.active } : w));
      setToggleWorkflow(null);
    }
  };

  const openWorkflow = (id: string) => {
    navigate(`/create?id=${id}`); // Or wherever the workflow builder is
  };

  const createWorkflow = () => {
    navigate('/create');
  }

  return (
    <div className="container pb-32 pt-24 max-w-full mx-auto px-4 md:px-8 min-h-screen relative flex flex-col">
      <h1 
        className="text-lg md:text-xl lg:text-[2rem] leading-[1.1] tracking-tight mb-10"
        style={{ fontFamily: "'Nunito', sans-serif" }}
      >
        <span className="font-medium text-foreground/80 block mb-2">My Workflows</span>
      </h1>
      
      <Tabs defaultValue="in-progress" className="w-full flex-1 flex flex-col">
        <TabsList className="mb-4 grid w-full grid-cols-2 h-10">
          <TabsTrigger value="in-progress" className="text-base md:text-base">In Progress</TabsTrigger>
          <TabsTrigger value="deployed" className="text-base md:text-base">Deployed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="in-progress" className="mt-0 flex flex-col gap-1">
          {inProgress.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center border rounded-xl border-dashed">No workflows in progress.</p>
          ) : (
            inProgress.map(w => (
              <WorkflowCard key={w.id} workflow={w} onClick={() => openWorkflow(w.id)} />
            ))
          )}
          
          {/* Pagination */}
          {inProgress.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4 border-t border-border/50 pt-4 mt-4">
              <div className="text-sm text-muted-foreground">Showing 1-{inProgress.length} of {inProgress.length}</div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled className="h-8 w-8 p-0">
                  <span className="sr-only">Previous page</span>
                  {'<'}
                </Button>
                <Button variant="outline" size="sm" disabled className="h-8 w-8 p-0">
                  <span className="sr-only">Next page</span>
                  {'>'}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="deployed" className="mt-0 flex flex-col gap-1">
          {deployed.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center border rounded-xl border-dashed">No deployed workflows.</p>
          ) : (
            deployed.map(w => (
              <WorkflowCard 
                key={w.id} 
                workflow={w} 
                onClick={() => openWorkflow(w.id)}
                onToggle={(e) => {
                  e.stopPropagation();
                  setToggleWorkflow(w);
                }} 
              />
            ))
          )}
          
          {/* Pagination */}
          {deployed.length > 0 && (
            <div className="flex items-center justify-between px-2 py-4 border-t border-border/50 pt-4 mt-4">
              <div className="text-sm text-muted-foreground">Showing 1-{deployed.length} of {deployed.length}</div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled className="h-8 w-8 p-0">
                  <span className="sr-only">Previous page</span>
                  {'<'}
                </Button>
                <Button variant="outline" size="sm" disabled className="h-8 w-8 p-0">
                  <span className="sr-only">Next page</span>
                  {'>'}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Toggle Confirmation Dialog */}
      <AlertDialog open={!!toggleWorkflow} onOpenChange={(open: boolean) => !open && setToggleWorkflow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleWorkflow?.active ? 'Deactivate Workflow?' : 'Activate Workflow?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleWorkflow?.active 
                ? `Are you sure you want to deactivate "${toggleWorkflow?.name}"? It will stop executing trades.` 
                : `Are you sure you want to activate "${toggleWorkflow?.name}"? It will begin executing trades based on its logic.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleToggle} className={toggleWorkflow?.active ? 'bg-red-500 hover:bg-red-600 text-white' : ''}>
              {toggleWorkflow?.active ? 'Deactivate' : 'Activate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Floating Action Button */}
      <button 
        onClick={createWorkflow}
        className="fixed bottom-8 right-8 md:bottom-12 md:right-12 w-14 h-14 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-[0_4px_14px_0_rgba(0,0,0,0.39)] hover:shadow-[0_6px_20px_rgba(0,0,0,0.23)] hover:scale-105 active:scale-95 transition-all z-50 group"
      >
        <Plus size={28} className="group-hover:rotate-90 transition-transform duration-300" />
      </button>
    </div>
  );
}

function WorkflowCard({ workflow, onClick, onToggle }: { workflow: Workflow; onClick: () => void; onToggle?: (e: React.MouseEvent) => void }) {
  return (
    <Card 
      onClick={onClick}
      className="hover:bg-accent/40 transition-colors cursor-pointer group border-border/50 shadow-sm hover:shadow-md"
    >
      <CardContent className="p-3 px-4 flex items-center gap-4 min-h-[56px]">
        {/* ID Badge */}
        <div className="shrink-0 hidden sm:flex items-center justify-center font-mono text-[11px] font-medium w-28 truncate border border-yellow-500/50 bg-yellow-500/10 text-yellow-900 dark:text-white px-2 py-1 rounded-md">
          {workflow.id}
        </div>
        
        {/* Name */}
        <div className="font-semibold text-foreground truncate min-w-0 flex-1 md:flex-none md:w-48 text-sm md:text-base">
          {workflow.name}
        </div>
        
        {/* Description - hidden on small screens */}
        <div className="hidden md:flex flex-1 min-w-0 items-center">
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="text-sm text-muted-foreground truncate cursor-help w-full text-left">
                  {workflow.description}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px] p-3 text-sm" sideOffset={8}>
                <p>{workflow.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Action Button Container - reserves space so layouts match perfectly */}
        <div className="ml-auto shrink-0 flex items-center justify-end min-w-[40px]">
          {workflow.status === 'deployed' && (
            <div className="pl-3 border-l border-border/50 flex items-center">
              <button 
                onClick={onToggle}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${workflow.active ? 'text-green-500 hover:bg-green-500/10 hover:shadow-[0_0_10px_rgba(34,197,94,0.3)]' : 'text-muted-foreground hover:bg-muted'}`}
              >
                <Play size={16} fill="currentColor" className={workflow.active ? "opacity-100" : "opacity-50"} />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
