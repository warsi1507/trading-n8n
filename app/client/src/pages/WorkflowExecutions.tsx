import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@clerk/react";
import { ArrowLeft, Loader2, CheckCircle2, XCircle, Clock, AlertCircle, Ban, X, ChevronDown, ChevronRight, Activity } from "lucide-react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ReactFlow, Background, useNodesState, useEdgesState } from "@xyflow/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

// Node components
import { PriceTrigger } from "@/nodes/triggers/PriceTrigger";
import { TimeTrigger } from "@/nodes/triggers/TimeTrigger";
import { Backpack } from "@/nodes/actions/Backpack";
import type { Workflow, IExecution, INodeExecution } from "@trading-n8n/common";
import { Hyperliquid } from "@/nodes/actions/Hyperliquid";
import { Lighter } from "@/nodes/actions/Lighter";
import type { Node, Edge } from "@xyflow/react";

const nodeTypes = {
  "price-trigger": PriceTrigger,
  "time-trigger": TimeTrigger,
  backpack: Backpack,
  hyperliquid: Hyperliquid,
  lighter: Lighter,
};

function JsonViewer({ data, name = "data" }: { data: any; name?: string }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (data === undefined || data === null) return <span className="text-muted-foreground">null</span>;
  
  if (typeof data !== "object") {
    return <span className="text-green-600 dark:text-green-400 font-mono text-xs">{JSON.stringify(data)}</span>;
  }

  const isArray = Array.isArray(data);
  const keys = Object.keys(data);
  
  if (keys.length === 0) {
    return <span className="text-muted-foreground font-mono text-xs">{isArray ? "[]" : "{}"}</span>;
  }

  return (
    <div className="font-mono text-xs">
      <div 
        className="flex items-center gap-1 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 py-0.5 rounded px-1 -ml-1 select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? <ChevronDown className="w-3 h-3 opacity-50" /> : <ChevronRight className="w-3 h-3 opacity-50" />}
        <span className="text-blue-600 dark:text-blue-400 font-semibold">{name}</span>
        <span className="text-muted-foreground opacity-50">{isArray ? `[${keys.length}]` : `{${keys.length}}`}</span>
      </div>
      {isExpanded && (
        <div className="pl-4 border-l border-border/50 ml-1 mt-1 space-y-1">
          {keys.map((key) => (
            <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-2">
              {!isArray && <span className="text-purple-600 dark:text-purple-400 shrink-0">{key}:</span>}
              <div className="flex-1 overflow-x-auto">
                <JsonViewer data={data[key as keyof typeof data]} name={key} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case "SUCCESS": return <CheckCircle2 className="text-green-500 w-4 h-4" />;
    case "FAILED": return <XCircle className="text-red-500 w-4 h-4" />;
    case "RUNNING": return <Loader2 className="text-blue-500 w-4 h-4 animate-spin" />;
    case "PENDING": return <Clock className="text-yellow-500 w-4 h-4" />;
    case "CANCELED": return <Ban className="text-gray-500 w-4 h-4" />;
    case "UNKNOWN": return <AlertCircle className="text-orange-500 w-4 h-4" />;
    default: return null;
  }
};

export default function WorkflowExecutions() {
  const { display_id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const execIdParam = searchParams.get("execId");
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [executions, setExecutions] = useState<(IExecution & { _id: string, duration_ms?: number })[]>([]);
  const [selectedExecution, setSelectedExecution] = useState<(IExecution & { _id: string, duration_ms?: number }) | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // React Flow state
  const [nodes, setNodes] = useNodesState<Node>([]);
  const [edges, setEdges] = useEdgesState<Edge>([]);

  // Fetch workflow and execution list
  useEffect(() => {
    const loadData = async () => {
      if (!display_id) return;
      try {
        setIsLoading(true);
        const token = await getToken();
        
        // Fetch workflow metadata
        const wfRes = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/workflows/${display_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (wfRes.ok) {
          const wfData = await wfRes.json();
          setWorkflow(wfData);
          
          // Load deployed graph by default
          if (wfData.deployed_version) {
            setNodes(wfData.deployed_version.nodes || []);
            setEdges(wfData.deployed_version.edges || []);
          }
        }

        // Fetch executions list
        const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/executions/workflow/${display_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const execData = await res.json();
          setExecutions(execData.executions || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [display_id, getToken]);

  // Load specific execution details if selected
  useEffect(() => {
    const loadExecutionDetails = async () => {
      if (!execIdParam) {
        setSelectedExecution(null);
        setSelectedNodeId(null);
        return;
      }
      try {
        const token = await getToken();
        const res = await fetch(`${import.meta.env.VITE_API_URL || ""}/api/executions/${execIdParam}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSelectedExecution(data);
          // Auto-select first failed node, or just first node
          if (data.nodes && data.nodes.length > 0) {
            const failedNode = data.nodes.find((n: INodeExecution) => n.status === "FAILED");
            setSelectedNodeId(failedNode ? failedNode.node_id : data.nodes[0].node_id);
          } else {
            setSelectedNodeId(null);
          }
        }
      } catch (err) {
        console.error("Failed to load execution details", err);
      }
    };
    loadExecutionDetails();
  }, [execIdParam, getToken]);

  // Derive styled nodes based on execution state
  const displayNodes = useMemo(() => {
    if (!selectedExecution || !selectedExecution.nodes) {
      // Default normal view
      return nodes.map(n => ({ ...n, draggable: false, selectable: true }));
    }

    const nodeStatusMap = new Map(selectedExecution.nodes.map((n: INodeExecution) => [n.node_id, n]));
    
    return nodes.map(n => {
      const execNode = nodeStatusMap.get(n.id);
      let ringColor = "ring-transparent";
      
      if (execNode) {
        if (execNode.status === "SUCCESS") ringColor = "ring-green-500/80 shadow-green-500/20";
        else if (execNode.status === "FAILED") ringColor = "ring-red-500/80 shadow-red-500/20";
        else if (execNode.status === "RUNNING") ringColor = "ring-blue-500/80 shadow-blue-500/20 animate-pulse";
        else if (execNode.status === "UNKNOWN") ringColor = "ring-orange-500/80 shadow-orange-500/20";
        else ringColor = "ring-gray-500/50 shadow-gray-500/20";
      }

      const isSelected = selectedNodeId === n.id;
      
      return {
        ...n,
        draggable: false,
        selectable: true,
        className: `transition-all duration-300 ring-2 ring-offset-4 ring-offset-background rounded-xl shadow-lg ${ringColor} ${isSelected ? 'ring-4 scale-105 z-50' : 'hover:ring-4 hover:scale-105 z-10'} bg-card`,
      };
    });
  }, [nodes, selectedExecution, selectedNodeId]);

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleExecutionSelect = (id: string) => {
    setSearchParams({ execId: id });
  };

  const handleBackToList = () => {
    setSearchParams({});
  };

  const formatDate = (d: string | Date) => new Date(d).toLocaleString();
  const formatDuration = (ms?: number, status?: string) => {
    if (status === "RUNNING" || status === "PENDING") return "-";
    if (ms === undefined) return "-";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (isLoading && !workflow) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Find node details if execution is selected
  const activeNode = nodes.find(n => n.id === selectedNodeId);
  const activeNodeExec = selectedExecution?.nodes?.find((n: INodeExecution) => n.node_id === selectedNodeId);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      {/* Top Header */}
      <div className="h-14 shrink-0 border-b flex items-center px-4 gap-4 bg-card z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/workflows/${display_id}`)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-semibold">{workflow?.name}</span>
            <Badge variant="outline" className="text-[10px] py-0">{workflow?.display_id}</Badge>
          </div>
          <span className="text-xs text-muted-foreground truncate w-64 md:w-auto">Execution History</span>
        </div>
      </div>

      <div className="flex-1 overflow-hidden relative">
        <ResizablePanelGroup orientation="horizontal">
          
          {/* Left Panel: ReactFlow Canvas */}
          <ResizablePanel defaultSize={65} minSize={30}>
            <div className="w-full h-full relative">
              {selectedExecution && (selectedExecution.status === 'RUNNING' || selectedExecution.status === 'PENDING') && (
                <div className="absolute top-4 right-4 z-10">
                  <Button disabled variant="secondary" className="gap-2 shadow-sm">
                    <Ban className="w-4 h-4" />
                    Cancel
                  </Button>
                </div>
              )}
              <ReactFlow
                nodes={displayNodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodeClick={onNodeClick}
                nodesConnectable={false}
                nodesDraggable={false}
                elementsSelectable={true}
                minZoom={0.5}
                maxZoom={2}
                defaultViewport={{ x: 100, y: 50, zoom: 1 }}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="hsl(var(--muted-foreground))" gap={16} />
              </ReactFlow>
            </div>
          </ResizablePanel>

          <ResizableHandle className="w-1 bg-border/50 hover:bg-primary transition-colors cursor-col-resize" />

          {/* Right Panel: Execution List OR Node Details */}
          <ResizablePanel defaultSize={35} minSize={25} className="bg-card flex flex-col h-full border-l">
            {!selectedExecution ? (
              // List View
              <div className="flex flex-col h-full">
                <div className="p-4 border-b shrink-0 flex items-center justify-between bg-muted/20">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Activity className="w-4 h-4" /> 
                    Executions
                  </h3>
                  <Badge variant="secondary">{executions.length}</Badge>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                  {executions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      No executions recorded yet.
                    </div>
                  ) : (
                    executions.map(exec => (
                      <div 
                        key={exec._id} 
                        onClick={() => handleExecutionSelect(exec.display_id || exec._id)}
                        className="p-3 rounded-xl border bg-card hover:bg-accent/50 cursor-pointer transition-colors flex justify-between gap-2 group"
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <StatusIcon status={exec.status} />
                            <span className="font-mono text-sm font-semibold">Execution-{exec.display_id || exec._id.substring(0,8)}</span>
                            <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">{formatDuration(exec.duration_ms, exec.status)}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(exec.started_at)}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <ChevronRight className="w-4 h-4 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              // Details View
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="p-4 border-b shrink-0 bg-muted/20 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon status={selectedExecution.status} />
                        <span className="font-mono font-bold text-lg">Execution-{selectedExecution.display_id || selectedExecution._id.substring(0,8)}</span>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={handleBackToList}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex gap-4 text-xs text-muted-foreground px-1">
                    <div><strong>Start:</strong> {formatDate(selectedExecution.started_at)}</div>
                    <div><strong>Duration:</strong> {formatDuration(selectedExecution.duration_ms, selectedExecution.status)}</div>
                  </div>
                </div>

                {/* Node Details */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                  {!selectedNodeId ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Select a node on the canvas to inspect it.
                    </div>
                  ) : !activeNode ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Node not found in current graph.
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-base">{(activeNode.data?.name as string) || "Unknown Node"}</h3>
                          <p className="text-xs text-muted-foreground">{(activeNode.data?.description as string) || "No description"}</p>
                        </div>
                        <Badge variant="outline" className="uppercase text-[10px]">
                          {activeNode.type}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs border rounded-lg p-3 bg-muted/10">
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Status</span>
                          <div className="flex items-center gap-1 font-semibold">
                            {activeNodeExec ? <StatusIcon status={activeNodeExec.status} /> : <Ban className="w-3 h-3 text-muted-foreground" />}
                            <span>{activeNodeExec?.status || "DID NOT RUN"}</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-muted-foreground">Duration</span>
                          <span className="font-mono">{formatDuration(activeNodeExec?.duration_ms, activeNodeExec?.status)}</span>
                        </div>
                      </div>

                      {/* Input Data */}
                      {activeNodeExec?.input_data && (
                        <div className="flex flex-col gap-2">
                          <h4 className="text-sm font-semibold">Input Data</h4>
                          <div className="bg-muted/30 border rounded-xl p-3 overflow-hidden">
                            <JsonViewer data={activeNodeExec.input_data} name="input" />
                          </div>
                        </div>
                      )}

                      {/* Output Data */}
                      {activeNodeExec?.output_data && (
                        <div className="flex flex-col gap-2">
                          <h4 className="text-sm font-semibold">Output Data</h4>
                          <div className="bg-muted/30 border rounded-xl p-3 overflow-hidden">
                            <JsonViewer data={activeNodeExec.output_data} name="output" />
                          </div>
                        </div>
                      )}

                      {/* Error Data */}
                      {activeNodeExec?.error && (
                        <div className="flex flex-col gap-2">
                          <h4 className="text-sm font-semibold text-red-500">Error</h4>
                          <div className="bg-red-500/5 border border-red-500/30 rounded-xl p-3 overflow-hidden">
                            <div className="text-xs font-mono text-red-600 dark:text-red-400 whitespace-pre-wrap">
                              {typeof activeNodeExec.error === 'object' 
                                ? (activeNodeExec.error.message || JSON.stringify(activeNodeExec.error, null, 2))
                                : String(activeNodeExec.error)}
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
