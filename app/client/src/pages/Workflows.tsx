import { useState, useEffect } from "react";
import { Plus, Play } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@clerk/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

type WorkflowStatus = "DRAFT" | "IN_EDIT" | "DEPLOYED";

interface Workflow {
  _id: string;
  display_id: string;
  name: string;
  description: string;
  status: WorkflowStatus;
  is_active: boolean;
  updated_at: string;
}

export default function Workflows() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toggleWorkflow, setToggleWorkflow] = useState<Workflow | null>(null);

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const res = await fetch("/api/workflows", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch workflows");
      const data = await res.json();
      setWorkflows(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const inProgress = workflows.filter((w) => w.status === "DRAFT" || w.status === "IN_EDIT");
  const deployed = workflows.filter((w) => w.status === "DEPLOYED");

  const handleToggle = () => {
    if (toggleWorkflow) {
      setWorkflows((prev) =>
        prev.map((w) =>
          w._id === toggleWorkflow._id ? { ...w, is_active: !w.is_active } : w,
        ),
      );
      setToggleWorkflow(null);
    }
  };

  const openWorkflow = (display_id: string) => {
    navigate(`/workflows/${display_id}`);
  };

  const createWorkflow = async () => {
    try {
      const token = await getToken();
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error("Failed to create workflow");
      
      const data = await res.json();
      navigate(`/workflows/${data.display_id}`);
    } catch (err) {
      console.error("Error creating workflow:", err);
    }
  };

  return (
    <div className="pb-32 pt-24 w-[95%] lg:w-[85%] max-w-none ml-0 pr-4 md:pr-8 pl-4 sm:pl-[124px] md:pl-[140px] min-h-screen relative flex flex-col">
      <h1
        className="text-lg md:text-xl lg:text-[2rem] leading-[1.1] tracking-tight mb-8 text-foreground"
        style={{ fontFamily: "'Nunito', sans-serif" }}
      >
        <span className="font-medium block">My Workflows</span>
      </h1>

      <Tabs defaultValue="in-progress" className="w-full flex-1 flex flex-col">
        <TabsList className="mb-6 flex w-full justify-start h-auto p-0 bg-transparent border-b border-border/40 rounded-none space-x-6">
          <TabsTrigger
            value="in-progress"
            className="text-base md:text-base px-1 pb-3 pt-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
          >
            In Progress
          </TabsTrigger>
          <TabsTrigger
            value="deployed"
            className="text-base md:text-base px-1 pb-3 pt-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
          >
            Deployed
          </TabsTrigger>
        </TabsList>

        <TabsContent value="in-progress" className="mt-0 flex flex-col gap-2">
          {inProgress.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center border rounded-xl border-dashed border-border/50">
              No workflows in progress.
            </p>
          ) : (
            inProgress.map((w) => (
              <WorkflowCard
                key={w.id}
                workflow={w}
                onClick={() => openWorkflow(w.id)}
              />
            ))
          )}

          {/* Pagination */}
          {inProgress.length > 0 && (
            <div className="flex items-center justify-between py-4 border-t border-gray-200 dark:border-white/10 mt-4 px-0">
              <div className="text-sm text-muted-foreground">
                Showing 1-{inProgress.length} of {inProgress.length}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 w-8 p-0 border-gray-200 dark:border-white/10 bg-transparent"
                >
                  <span className="sr-only">Previous page</span>
                  {"<"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 w-8 p-0 border-gray-200 dark:border-white/10 bg-transparent"
                >
                  <span className="sr-only">Next page</span>
                  {">"}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="deployed" className="mt-0 flex flex-col gap-2">
          {deployed.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center border rounded-xl border-dashed border-border/50">
              No deployed workflows.
            </p>
          ) : (
            deployed.map((w) => (
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
            <div className="flex items-center justify-between py-4 border-t border-gray-200 dark:border-white/10 mt-4 px-0">
              <div className="text-sm text-muted-foreground">
                Showing 1-{deployed.length} of {deployed.length}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 w-8 p-0 border-gray-200 dark:border-white/10 bg-transparent"
                >
                  <span className="sr-only">Previous page</span>
                  {"<"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled
                  className="h-8 w-8 p-0 border-gray-200 dark:border-white/10 bg-transparent"
                >
                  <span className="sr-only">Next page</span>
                  {">"}
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Toggle Confirmation Dialog */}
      <AlertDialog
        open={!!toggleWorkflow}
        onOpenChange={(open: boolean) => !open && setToggleWorkflow(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleWorkflow?.active
                ? "Deactivate Workflow?"
                : "Activate Workflow?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleWorkflow?.active
                ? `Are you sure you want to deactivate "${toggleWorkflow?.name}"? It will stop executing trades.`
                : `Are you sure you want to activate "${toggleWorkflow?.name}"? It will begin executing trades based on its logic.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggle}
              className={
                toggleWorkflow?.active
                  ? "bg-red-500 hover:bg-red-600 text-white"
                  : ""
              }
            >
              {toggleWorkflow?.active ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Updated Action Button */}
      <button
        onClick={createWorkflow}
        className="fixed bottom-8 right-8 md:bottom-12 md:right-12 h-12 px-6 bg-sky-400 hover:bg-sky-300 text-sky-950 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm transition-colors z-50 group border border-sky-400/20"
      >
        <Plus
          size={20}
          className="group-hover:rotate-90 transition-transform duration-300"
        />
        <span>Workflow</span>
      </button>
    </div>
  );
}

function WorkflowCard({
  workflow,
  onClick,
  onToggle,
}: {
  workflow: Workflow;
  onClick: () => void;
  onToggle?: (e: React.MouseEvent) => void;
}) {
  return (
    <Card
      onClick={onClick}
      className="bg-black/[0.02] dark:bg-white/[0.02] border-gray-200 dark:border-white/10 shadow-none hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors cursor-pointer group rounded-xl"
    >
      <CardContent className="p-0 flex items-center gap-4 py-4 px-5 min-h-[72px]">
        {/* ID Badge */}
        <div className="shrink-0 hidden sm:flex items-center justify-center font-mono text-[11px] font-medium w-28 truncate border border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-1 rounded-md">
          {workflow.display_id}
        </div>

        {/* Name */}
        <div className="font-semibold text-foreground truncate min-w-0 flex-1 md:flex-none md:w-48 text-base">
          {workflow.name}
        </div>

        {/* Description - hidden on small screens */}
        <div className="hidden md:flex flex-1 min-w-0 items-center">
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className="text-sm text-muted-foreground truncate cursor-help w-full text-left">
                  {workflow.description || "No description provided."}
                </div>
              </TooltipTrigger>
              <TooltipContent
                className="max-w-[300px] p-3 text-sm"
                sideOffset={8}
              >
                <p>{workflow.description || "No description provided."}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Action Button Container */}
        <div className="ml-auto shrink-0 flex items-center justify-end min-w-[40px]">
          {workflow.status === "DEPLOYED" && (
            <div className="pl-3 border-l border-gray-200 dark:border-white/10 flex items-center">
              <button
                onClick={onToggle}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${workflow.is_active ? "text-green-500 hover:bg-green-500/10 hover:shadow-[0_0_15px_rgba(34,197,94,0.2)]" : "text-muted-foreground hover:bg-accent/30"}`}
              >
                <Play
                  size={16}
                  fill="currentColor"
                  className={workflow.is_active ? "opacity-100" : "opacity-40"}
                />
              </button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
