import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, AlertCircle, Clock, Ban } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/react";

interface Execution {
  _id: string;
  display_id: string; // e.g. EXEC-1
  status: "PENDING" | "RUNNING" | "SUCCESS" | "FAILED" | "CANCELED" | "UNKNOWN";
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
      const res = await fetch(`/api/executions?page=${pageToFetch}`, {
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
    <div className="container mx-auto p-4 md:p-8 max-w-5xl h-[calc(100vh-4rem)] flex flex-col">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate("/workflows")}>
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Executions</h1>
          <p className="text-muted-foreground mt-1">Global log of all your automated trading runs.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-2 pb-20">
        {loading && executions.length === 0 ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : executions.length === 0 ? (
          <div className="text-center p-12 border rounded-xl bg-card/50 border-dashed">
            <h3 className="font-medium text-lg">No Executions Found</h3>
            <p className="text-muted-foreground mt-2">You haven't run any workflows yet.</p>
          </div>
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
                    {exec.display_id || exec._id.substring(0, 8)}
                  </div>
                </div>

                {/* Name */}
                <div className="font-semibold text-foreground truncate min-w-0 flex-1 md:flex-none md:w-48 text-base">
                  {exec.workflow_id?.name || 'Deleted Workflow'}
                </div>

                {/* Description */}
                <div className="hidden md:flex flex-1 min-w-0 items-center text-sm text-muted-foreground truncate w-full text-left">
                  {exec.workflow_id?.description || 'No description provided.'}
                </div>

                {/* Status */}
                <div className="ml-auto shrink-0 flex items-center justify-end gap-1">
                  <StatusBadge status={exec.status} />
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 pt-6">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
