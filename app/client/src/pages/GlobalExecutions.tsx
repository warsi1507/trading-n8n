import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2, XCircle, AlertCircle, Clock, Ban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Execution {
  _id: string;
  display_id: string; // e.g. EXEC-1
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELED" | "UNKNOWN";
  started_at: string;
  ended_at?: string;
  workflow_id: {
    _id: string;
    display_id: string;
    name: string;
    description: string;
  };
}

export default function GlobalExecutions() {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchExecutions = async (pageToFetch: number) => {
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/executions?page=${pageToFetch}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setExecutions(data.executions);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExecutions(page);
  }, [page]);

  const StatusIcon = ({ status }: { status: Execution['status'] }) => {
    switch (status) {
      case "SUCCESS": return <CheckCircle2 className="text-green-500 w-5 h-5" />;
      case "FAILED": return <XCircle className="text-red-500 w-5 h-5" />;
      case "RUNNING": return <Loader2 className="text-blue-500 w-5 h-5 animate-spin" />;
      case "PENDING": return <Clock className="text-yellow-500 w-5 h-5" />;
      case "CANCELED": return <Ban className="text-gray-500 w-5 h-5" />;
      case "UNKNOWN": return <AlertCircle className="text-orange-500 w-5 h-5" />;
      default: return null;
    }
  };

  const StatusBadge = ({ status }: { status: Execution['status'] }) => {
    const colors = {
      SUCCESS: "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20",
      FAILED: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
      RUNNING: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      PENDING: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20",
      CANCELED: "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20",
      UNKNOWN: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/20",
    };

    return (
      <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${colors[status]}`}>
        <StatusIcon status={status} />
        {status}
      </div>
    );
  };

  return (
    <div className="pb-32 pt-24 w-[95%] lg:w-[85%] max-w-none ml-0 pr-4 md:pr-8 pl-4 sm:pl-[124px] md:pl-[140px] min-h-screen relative flex flex-col">
      <h1
        className="text-lg md:text-xl lg:text-[2rem] leading-[1.1] tracking-tight mb-8 text-foreground"
        style={{ fontFamily: "'Nunito', sans-serif" }}
      >
        <span className="font-medium block">Executions</span>
      </h1>

      <div className="mt-0 flex flex-col gap-2 flex-1">
        {loading && executions.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center border rounded-xl border-dashed border-border/50">
            Loading executions...
          </p>
        ) : executions.length === 0 ? (
          <p className="text-muted-foreground py-12 text-center border rounded-xl border-dashed border-border/50">
            No executions found. You haven't run any workflows yet.
          </p>
        ) : (
          executions.map((exec) => (
            <Card
              key={exec._id}
              onClick={() => navigate(`/workflows/${exec.workflow_id?.display_id}/executions?execId=${exec.display_id || exec._id}`)}
              className="bg-black/[0.02] dark:bg-white/[0.02] border-gray-200 dark:border-white/10 shadow-none hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors group rounded-xl cursor-pointer"
            >
              <CardContent className="p-0 flex items-center gap-4 py-3 px-4 min-h-[60px]">
                
                {/* ID Badges */}
                <div className="shrink-0 hidden sm:flex items-center gap-2">
                  <div className="font-mono text-[11px] font-medium w-fit border border-sky-500/20 bg-sky-500/10 text-sky-600 dark:text-sky-400 px-2 py-1 rounded-md">
                    {exec.workflow_id?.display_id || 'deleted-workflow'}
                  </div>
                  <div className="font-mono text-[11px] font-medium w-fit border border-purple-500/20 bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-md">
                    execution-{exec.display_id || exec._id.substring(0, 8)}
                  </div>
                </div>

                {/* Name */}
                <div className="font-semibold text-foreground truncate min-w-0 flex-1 md:flex-none md:w-48 text-base">
                  {exec.workflow_id?.name || 'Deleted Workflow'}
                </div>

                {/* Description */}
                <div className="hidden md:flex flex-1 min-w-0 items-center">
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <div className="text-sm text-muted-foreground truncate w-full text-left cursor-help">
                          {exec.workflow_id?.description || 'No description provided.'}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent className="max-w-[300px] p-3 text-sm" sideOffset={8}>
                        <p>{exec.workflow_id?.description || 'No description provided.'}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                {/* Status & Actions */}
                <div className="ml-auto shrink-0 flex items-center justify-end gap-3">
                  {exec.status !== 'RUNNING' && exec.status !== 'PENDING' && (
                    <span className="hidden sm:block text-xs text-muted-foreground tabular-nums">
                      {new Date(exec.ended_at || exec.started_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <StatusBadge status={exec.status} />
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
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
    </div>
  );
}
