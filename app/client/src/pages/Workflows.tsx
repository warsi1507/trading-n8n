import { useState, useEffect } from "react";
import { Plus, Play, ArchiveRestore, Activity } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";

type WorkflowStatus = "DRAFT" | "PAUSED" | "DEPLOYED";

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
  
  const [activeTab, setActiveTab] = useState("IN_PROGRESS");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Dialog States
  const [toggleWorkflow, setToggleWorkflow] = useState<Workflow | null>(null);
  const [archiveWorkflow, setArchiveWorkflow] = useState<Workflow | null>(null);
  const [unarchiveWorkflow, setUnarchiveWorkflow] = useState<Workflow | null>(null);
  const [archiveConfirmName, setArchiveConfirmName] = useState("");

  useEffect(() => {
    fetchWorkflows();
  }, [activeTab, page]);

  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/workflows?tab=${activeTab}&page=${page}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to fetch workflows");
      const data = await res.json();
      setWorkflows(data.data);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (val: string) => {
    setActiveTab(val);
    setPage(1);
  };

  const handleToggle = async () => {
    if (toggleWorkflow) {
      try {
        const token = await getToken();
        const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/workflows/${toggleWorkflow.display_id}/toggle`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to toggle workflow");
        fetchWorkflows();
        toast.success(toggleWorkflow.is_active ? "Workflow Deactivated" : "Workflow Activated");
      } catch (err) {
        console.error("Failed to toggle workflow", err);
        toast.error("Failed to toggle workflow");
      }
      setToggleWorkflow(null);
    }
  };

  const handleArchive = async () => {
    if (!archiveWorkflow) return;
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/workflows/${archiveWorkflow.display_id}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error("Failed to archive workflow");

      if (archiveWorkflow.is_active || archiveWorkflow.status === 'DEPLOYED') {
        toast.warning("Executions Canceled", {
          description: "Archiving this active workflow has canceled any running executions. Verify your positions.",
          duration: 8000
        });
      } else {
        toast.success("Workflow Archived");
      }
      setArchiveWorkflow(null);
      setArchiveConfirmName("");
      fetchWorkflows();
    } catch (err) {
      console.error("Failed to archive workflow", err);
      toast.error("Failed to archive workflow");
    }
  };

  const handleUnarchive = async () => {
    if (!unarchiveWorkflow) return;
    try {
      const token = await getToken();
      await fetch(`${import.meta.env.VITE_API_URL || ""}/api/workflows/${unarchiveWorkflow.display_id}/unarchive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnarchiveWorkflow(null);
      fetchWorkflows();
      toast.success("Workflow Restored");
    } catch (err) {
      console.error("Failed to unarchive workflow", err);
      toast.error("Failed to restore workflow");
    }
  };

  const openWorkflow = (display_id: string) => {
    if (activeTab === "ARCHIVED") return;
    navigate(`/workflows/${display_id}`);
  };

  const createWorkflow = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/workflows`, {
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

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full flex-1 flex flex-col">
        <TabsList className="mb-6 flex w-full justify-start h-auto p-0 bg-transparent border-b border-border/40 rounded-none space-x-6">
          <TabsTrigger
            value="IN_PROGRESS"
            className="text-base md:text-base px-1 pb-3 pt-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
          >
            In Progress
          </TabsTrigger>
          <TabsTrigger
            value="DEPLOYED"
            className="text-base md:text-base px-1 pb-3 pt-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
          >
            Deployed
          </TabsTrigger>
          <TabsTrigger
            value="ARCHIVED"
            className="text-base md:text-base px-1 pb-3 pt-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:text-foreground text-muted-foreground hover:text-foreground transition-colors"
          >
            Archived
          </TabsTrigger>
        </TabsList>

        {activeTab === "ARCHIVED" && (
          <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-sm p-3 rounded-lg mb-4 flex items-center shrink-0">
            <strong>Note:</strong>&nbsp;Archived workflows will be permanently deleted after 30 days.
          </div>
        )}

        <div className="mt-0 flex flex-col gap-2 flex-1">
          {isLoading ? (
            <p className="text-muted-foreground py-12 text-center border rounded-xl border-dashed border-border/50">
              Loading workflows...
            </p>
          ) : workflows.length === 0 ? (
            <p className="text-muted-foreground py-12 text-center border rounded-xl border-dashed border-border/50">
              No workflows found in this tab.
            </p>
          ) : (
            workflows.map((w) => (
              <WorkflowCard
                key={w._id}
                workflow={w}
                isActiveTab={activeTab}
                onClick={() => openWorkflow(w.display_id)}
                onToggle={(e) => {
                  e.stopPropagation();
                  setToggleWorkflow(w);
                }}
                onUnarchive={(e) => {
                  e.stopPropagation();
                  setUnarchiveWorkflow(w);
                }}
              />
            ))
          )}

          {/* Pagination Controls */}
          {!isLoading && totalPages > 1 && (
            <div className="flex items-center justify-between py-4 border-t border-border/40 mt-4 px-0 shrink-0">
              <div className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  className="h-8 w-8 p-0 border-border/40 bg-transparent hover:bg-accent"
                >
                  <span className="sr-only">Previous page</span>
                  {"<"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  className="h-8 w-8 p-0 border-border/40 bg-transparent hover:bg-accent"
                >
                  <span className="sr-only">Next page</span>
                  {">"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Tabs>

      {/* Toggle Confirmation Dialog */}
      <AlertDialog open={!!toggleWorkflow} onOpenChange={(open: boolean) => !open && setToggleWorkflow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleWorkflow?.is_active ? "Deactivate Workflow?" : "Activate Workflow?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleWorkflow?.is_active
                ? `Are you sure you want to deactivate "${toggleWorkflow?.name}" ? It will stop executing trades.`
                : `Are you sure you want to activate "${toggleWorkflow?.name}" ? It will begin executing trades based on its logic.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggle}
              className={toggleWorkflow?.is_active ? "bg-red-500 hover:bg-red-600 text-white" : ""}
            >
              {toggleWorkflow?.is_active ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Archive Confirmation Dialog (Requires Name) */}
      <AlertDialog open={!!archiveWorkflow} onOpenChange={(open: boolean) => {
        if (!open) {
          setArchiveWorkflow(null);
          setArchiveConfirmName("");
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              This will archive <strong>"{archiveWorkflow?.name}"</strong> and immediately set its status to DRAFT.
              It will be permanently deleted in 30 days.
              <br/><br/>
              Please type <strong>{archiveWorkflow?.name}</strong> to confirm.
            </AlertDialogDescription>
            <Input 
              value={archiveConfirmName} 
              onChange={(e) => setArchiveConfirmName(e.target.value)} 
              placeholder="Type workflow name here..." 
              className="mt-4"
            />
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={archiveConfirmName !== archiveWorkflow?.name}
              onClick={handleArchive}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Unarchive Confirmation Dialog */}
      <AlertDialog open={!!unarchiveWorkflow} onOpenChange={(open: boolean) => !open && setUnarchiveWorkflow(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unarchive Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to restore "{unarchiveWorkflow?.name}"? 
              It will be moved back to In Progress.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnarchive}>
              Unarchive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Executions Button */}
      <button
        onClick={() => navigate("/workflows/executions")}
        className="fixed bottom-16 right-4 md:bottom-20 md:right-6 h-12 w-[160px] bg-secondary hover:bg-secondary/80 text-secondary-foreground rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm transition-colors z-50 border border-border"
      >
        <Activity size={20} />
        <span>Executions</span>
      </button>

      {/* Floating Action Button */}
      <button
        onClick={createWorkflow}
        className="fixed bottom-2 right-4 md:bottom-4 md:right-6 h-12 w-[160px] bg-sky-400 hover:bg-sky-300 text-sky-950 rounded-xl flex items-center justify-center gap-2 font-bold shadow-sm transition-colors z-50 group border border-sky-400/20"
      >
        <Plus size={20} className="group-hover:rotate-90 transition-transform duration-300" />
        <span>Workflow</span>
      </button>
    </div>
  );
}

function WorkflowCard({
  workflow,
  isActiveTab,
  onClick,
  onToggle,
  onUnarchive,
}: {
  workflow: Workflow;
  isActiveTab: string;
  onClick: () => void;
  onToggle: (e: React.MouseEvent) => void;
  onUnarchive: (e: React.MouseEvent) => void;
}) {
  return (
    <Card
      onClick={onClick}
      className={`bg-black/[0.02] dark:bg-white/[0.02] border-gray-200 dark:border-white/10 shadow-none hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors group rounded-xl ${isActiveTab !== "ARCHIVED" ? "cursor-pointer" : ""}`}
    >
      <CardContent className="p-0 flex items-center gap-4 py-3 px-4 min-h-[60px]">
        {/* ID Badge */}
        <div className="shrink-0 hidden sm:flex items-center justify-center font-mono text-[11px] font-medium w-fit border border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-1 rounded-md">
          {workflow.display_id}
        </div>

        {/* Name */}
        <div className="font-semibold text-foreground truncate min-w-0 flex-1 md:flex-none md:w-48 text-base">
          {workflow.name}
        </div>

        {/* Description */}
        <div className="hidden md:flex flex-1 min-w-0 items-center">
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <div className={`text-sm text-muted-foreground truncate w-full text-left ${isActiveTab !== "ARCHIVED" ? "cursor-help" : ""}`}>
                  {workflow.description || "No description provided."}
                </div>
              </TooltipTrigger>
              <TooltipContent className="max-w-[300px] p-3 text-sm" sideOffset={8}>
                <p>{workflow.description || "No description provided."}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Action Buttons */}
        <div className="ml-auto shrink-0 flex items-center justify-end gap-1">
          {isActiveTab === "DEPLOYED" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onToggle}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${workflow.is_active ? "text-green-500 hover:bg-green-500/10 hover:shadow-[0_0_15px_rgba(34,197,94,0.2)]" : "text-muted-foreground hover:bg-accent/30"}`}
                  >
                    <Play size={16} fill="currentColor" className={workflow.is_active ? "opacity-100" : "opacity-40"} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{workflow.is_active ? "Deactivate" : "Activate"}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {isActiveTab === "ARCHIVED" && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={onUnarchive}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
                  >
                    <ArchiveRestore size={16} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>Unarchive</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
