import { useState, useCallback, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/react";
import {
  ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  useReactFlow,
  Background,
  Panel,
  MarkerType,
} from "@xyflow/react";
import type {
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  Node,
  Edge,
  OnConnectEnd,
} from "@xyflow/react";
import { TriggerSheet } from "../components/TriggerSheet";
import { ActionSheet } from "../components/ActionSheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Play, Trash, Pencil, CheckCircle2, Pause, Activity } from "lucide-react";
import { PriceTrigger } from "@/nodes/triggers/PriceTrigger";
import { TimeTrigger } from "@/nodes/triggers/TimeTrigger";
import { Backpack } from "@/nodes/actions/Backpack";
import { Hyperliquid } from "@/nodes/actions/Hyperliquid";
import { Lighter } from "@/nodes/actions/Lighter";
import type { AppNode } from "@trading-n8n/common";
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

const nodeTypes = {
  "price-trigger": PriceTrigger,
  "time-trigger": TimeTrigger,
  backpack: Backpack,
  hyperliquid: Hyperliquid,
  lighter: Lighter,
};

const defaultEdgeOptions = {
  markerEnd: {
    type: MarkerType.ArrowClosed,
  },
};

export default function WorkflowEditor() {
  const { display_id } = useParams<{ display_id: string }>();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const [workflowData, setWorkflowData] = useState<any>(null);
  const [nodes, setNodes] = useState<AppNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"draft" | "deployed">("draft");
  const [isValid, setIsValid] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveConfirmName, setArchiveConfirmName] = useState("");

  const [triggerSheetState, setTriggerSheetState] = useState<{
    isOpen: boolean;
    editNode?: AppNode;
  }>({ isOpen: false });
  const [actionSheetState, setActionSheetState] = useState<{
    position?: { x: number; y: number };
    startingNodeId?: string;
    editNode?: AppNode;
  } | null>(null);

  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempDescription, setTempDescription] = useState("");

  const { screenToFlowPosition } = useReactFlow();

  const isReadOnly = viewMode === "deployed";

  useEffect(() => {
    async function loadWorkflow() {
      if (!display_id) return;
      try {
        const token = await getToken();
        const res = await fetch(`/api/workflows/${display_id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Failed to load workflow");
        const data = await res.json();
        
        setWorkflowData(data);
        setWorkflowName(data.name);
        setWorkflowDescription(data.description || "");
        
        if ((data.status === "DEPLOYED" || data.status === "PAUSED") && data.deployed_version) {
          setViewMode("deployed");
          setNodes(data.deployed_version.nodes || []);
          setEdges(data.deployed_version.edges || []);
          setIsValid(true); // Deployed is implicitly valid
        } else if (data.draft_version) {
          setViewMode("draft");
          setNodes(data.draft_version.nodes || []);
          setEdges(data.draft_version.edges || []);
          setIsValid(data.draft_version.is_valid || false);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadWorkflow();
  }, [display_id, getToken]);

  // Sync basic updates back to DB
  const saveWorkflowMetadata = async (updates: { name?: string, description?: string }) => {
    try {
      const token = await getToken();
      await fetch(`/api/workflows/${display_id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
    } catch (error) {
      console.error("Failed to save metadata", error);
    }
  };

  const saveGraphState = async (newNodes: AppNode[], newEdges: Edge[]) => {
    if (isReadOnly) return;
    try {
      const token = await getToken();
      await fetch(`/api/workflows/${display_id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ nodes: newNodes, edges: newEdges })
      });
      setIsValid(false);
    } catch (error) {
      console.error("Failed to save graph", error);
    }
  };

  const handleValidate = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/workflows/${display_id}/validate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setIsValid(data.is_valid);
      if (!data.is_valid) {
        alert("Validation Failed: " + data.message);
      }
    } catch (error) {
      console.error("Failed to validate", error);
    }
  };

  const handleDeploy = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/workflows/${display_id}/deploy`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        
        // If it was already deployed and active, warn them about canceled executions
        if (workflowData?.status === "DEPLOYED") {
          window.alert("Warning: Deploying a new version has immediately canceled any running executions of the old version. Please verify your exchange platform for any unmanaged positions.");
        }

        setViewMode("deployed");
        setWorkflowData(data);
      }
    } catch (error) {
      console.error("Failed to deploy", error);
    }
  };

  const handleEditMode = () => {
    setViewMode("draft");
    if (workflowData?.draft_version) {
      setNodes(workflowData.draft_version.nodes || []);
      setEdges(workflowData.draft_version.edges || []);
      setIsValid(workflowData.draft_version.is_valid || false);
    }
  };

  const handleArchive = async () => {
    try {
      const token = await getToken();
      await fetch(`/api/workflows/${display_id}/archive`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      navigate("/workflows");
    } catch (error) {
      console.error("Failed to archive", error);
    }
  };

  const handleNameClick = () => {
    if (isReadOnly) return;
    setTempName(workflowName);
    setIsEditingName(true);
  };
  const saveName = () => {
    const newName = tempName || "Untitled Workflow";
    setWorkflowName(newName);
    setIsEditingName(false);
    saveWorkflowMetadata({ name: newName });
  };

  const handleDescClick = () => {
    if (isReadOnly) return;
    setTempDescription(workflowDescription);
    setIsEditingDescription(true);
  };
  const saveDesc = () => {
    const newDesc = tempDescription;
    setWorkflowDescription(newDesc);
    setIsEditingDescription(false);
    saveWorkflowMetadata({ description: newDesc });
  };

  const handleTogglePause = async () => {
    if (!workflowData) return;
    try {
      const token = await getToken();
      const newStatus = workflowData.status === "PAUSED" ? "DEPLOYED" : "PAUSED";
      const res = await fetch(`/api/workflows/${display_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setWorkflowData({ ...workflowData, status: newStatus });
      }
    } catch (err) {
      console.error("Failed to toggle pause", err);
    }
  };

  const hasTrigger = nodes.some((n) => n.data.kind === "trigger");

  const onNodesChange: OnNodesChange<AppNode> = useCallback(
    (changes) => {
      if (isReadOnly) return;
      setNodes((nodesSnapshot) => {
        const newNodes = applyNodeChanges(changes, nodesSnapshot) as AppNode[];
        // Check if any node was removed
        if (changes.some(c => c.type === 'remove')) {
          saveGraphState(newNodes, edges);
        }
        return newNodes;
      });
    },
    [isReadOnly, edges],
  );

  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => {
      if (isReadOnly) return;
      setEdges((edgesSnapshot) => {
        const newEdges = applyEdgeChanges(changes, edgesSnapshot);
        if (changes.some(c => c.type === 'remove')) {
          saveGraphState(nodes, newEdges);
        }
        return newEdges;
      });
    },
    [isReadOnly, nodes],
  );

  const onNodeDragStop = useCallback((_event: any, node: Node) => {
    if (isReadOnly) return;
    const newNodes = nodes.map((n) => (n.id === node.id ? (node as AppNode) : n));
    saveGraphState(newNodes, edges);
  }, [nodes, edges, isReadOnly]);

  const onConnect: OnConnect = useCallback(
    (params) => {
      if (isReadOnly) return;
      setEdges((edgesSnapshot) => {
        const newEdges = addEdge(params, edgesSnapshot);
        saveGraphState(nodes, newEdges);
        return newEdges;
      });
    },
    [isReadOnly, nodes],
  );

  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      if (isReadOnly) return;
      if (!connectionState.isValid && connectionState.fromNode) {
        let clientX = 0;
        let clientY = 0;
        if ("clientX" in event) {
          clientX = (event as MouseEvent).clientX;
          clientY = (event as MouseEvent).clientY;
        } else if (
          "changedTouches" in event &&
          (event as TouchEvent).changedTouches.length > 0
        ) {
          clientX = (event as TouchEvent).changedTouches[0].clientX;
          clientY = (event as TouchEvent).changedTouches[0].clientY;
        }

        const position = screenToFlowPosition({ x: clientX, y: clientY });

        setActionSheetState({
          position,
          startingNodeId: connectionState.fromNode.id,
        });
      }
    },
    [screenToFlowPosition, isReadOnly],
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    if (isReadOnly) return;
    const appNode = node as AppNode;
    if (appNode.data.kind === "trigger") {
      setTriggerSheetState({ isOpen: true, editNode: appNode });
    } else {
      setActionSheetState({ editNode: appNode });
    }
  }, [isReadOnly]);

  if (isLoading) {
    return <div className="h-screen w-full flex items-center justify-center">Loading...</div>;
  }

  return (
    <div
      className="relative w-full"
      style={{ height: "calc(100vh - 64px)", marginTop: "64px" }}
    >
      {/* Top Navigation Bar */}
      <div className="absolute top-4 left-4 right-4 z-50 pointer-events-none flex flex-row justify-between items-start gap-4">
        <div className="flex flex-col gap-1 w-full max-w-[800px] pointer-events-auto bg-background/60 backdrop-blur-xl p-3 px-4 rounded-xl border border-border/50 shadow-sm transition-all">
          {isEditingName && !isReadOnly ? (
            <Input
              autoFocus
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={saveName}
              onKeyDown={(e) => e.key === "Enter" && saveName()}
              className="text-lg font-semibold bg-transparent border-none shadow-none h-auto p-0 focus-visible:ring-0 px-1 -ml-1 text-foreground"
            />
          ) : (
            <div className="flex items-center gap-2">
              <h1
                onClick={handleNameClick}
                className={`text-lg font-semibold px-1 -ml-1 truncate ${!isReadOnly ? "cursor-text hover:text-primary transition-colors text-foreground" : "text-foreground"}`}
              >
                {workflowName}
              </h1>
              {isReadOnly && (
                <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${workflowData?.status === "PAUSED" ? "bg-amber-500/10 text-amber-500 border-amber-500/20" : "bg-green-500/10 text-green-500 border-green-500/20"}`}>
                  {workflowData?.status === "PAUSED" ? "Paused" : "Deployed"}
                </span>
              )}
            </div>
          )}

          {isEditingDescription && !isReadOnly ? (
            <div className="flex flex-col gap-2 mt-1 animate-in fade-in slide-in-from-top-1">
              <textarea
                autoFocus
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                className="w-full min-h-[80px] text-xs text-foreground bg-muted/50 p-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border/50"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={saveDesc}
                  className="rounded-md h-7 px-3 text-xs"
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingDescription(false)}
                  className="rounded-md h-7 px-3 text-xs"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p
              onClick={handleDescClick}
              className={`text-xs text-muted-foreground line-clamp-2 px-1 -ml-1 mt-0.5 ${!isReadOnly ? "cursor-text hover:text-foreground transition-colors" : ""}`}
            >
              {workflowDescription || (isReadOnly ? "No description provided." : "Click to add a description...")}
            </p>
          )}
        </div>

        <div className="flex gap-2 pointer-events-auto mt-0.5 shrink-0">
          {viewMode === "deployed" ? (
            <>
              <Button
                variant="outline"
                onClick={handleTogglePause}
                className="gap-1.5 rounded-lg h-8 px-4 shadow-sm text-xs font-medium transition-all bg-card"
              >
                {workflowData?.status === "PAUSED" ? (
                  <><Play className="w-3 h-3 text-green-500" /> Activate</>
                ) : (
                  <><Pause className="w-3 h-3 text-amber-500" /> Pause</>
                )}
              </Button>
              <Button
                onClick={handleEditMode}
                className="gap-1.5 rounded-lg h-8 px-4 shadow-sm bg-primary text-primary-foreground text-xs font-medium transition-all"
              >
                <Pencil className="w-3 h-3" /> Edit
              </Button>
            </>
          ) : isValid ? (
            <Button
              onClick={handleDeploy}
              className="gap-1.5 rounded-lg h-8 px-4 shadow-sm bg-green-500 hover:bg-green-600 text-white text-xs font-medium transition-all"
            >
              <Play className="w-3 h-3" /> Deploy
            </Button>
          ) : (
            <Button
              onClick={handleValidate}
              className="gap-1.5 rounded-lg h-8 px-4 shadow-sm bg-amber-500 hover:bg-amber-600 text-white text-xs font-medium transition-all"
            >
              <CheckCircle2 className="w-3 h-3" /> Validate
            </Button>
          )}
          
          <Button
            variant="default"
            onClick={() => setIsArchiving(true)}
            className="gap-1.5 rounded-lg h-8 px-4 bg-red-500 hover:bg-red-600 text-white text-xs font-medium shadow-sm transition-all"
          >
            <Trash className="w-3 h-3" /> Delete
          </Button>
        </div>
      </div>

      <AlertDialog open={isArchiving} onOpenChange={setIsArchiving}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Workflow</AlertDialogTitle>
            <AlertDialogDescription>
              This will move <strong>"{workflowName}"</strong> to the Archive.
              It will be permanently deleted in 30 days.
              <br/><br/>
              Please type "<strong>{workflowName}</strong>" to confirm.
            </AlertDialogDescription>
            <Input 
              value={archiveConfirmName} 
              onChange={(e) => setArchiveConfirmName(e.target.value)} 
              placeholder="Type workflow name here..." 
              className="mt-4"
            />
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setArchiveConfirmName("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={archiveConfirmName !== workflowName}
              onClick={handleArchive}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {triggerSheetState.isOpen && !isReadOnly && (
        <TriggerSheet
          initialNode={triggerSheetState.editNode}
          onClose={() => setTriggerSheetState({ isOpen: false })}
          onDelete={() => {
            if (triggerSheetState.editNode) {
              const nodeId = triggerSheetState.editNode.id;
              const newNodes = nodes.filter((n) => n.id !== nodeId);
              const newEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
              setNodes(newNodes);
              setEdges(newEdges);
              saveGraphState(newNodes, newEdges);
              setTriggerSheetState({ isOpen: false });
            }
          }}
          onSelect={(type, name, description, metadata) => {
            let newNodes = [...nodes];
            if (triggerSheetState.editNode) {
              newNodes = nodes.map((n) =>
                n.id === triggerSheetState.editNode!.id
                  ? { ...n, type, data: { ...n.data, name, description, metadata } }
                  : n,
              );
            } else {
              newNodes.push({
                id: Math.random().toString(),
                type: type,
                data: { name, description, kind: "trigger", metadata },
                position: { x: 100, y: 100 },
              });
            }
            setNodes(newNodes);
            saveGraphState(newNodes, edges);
            setTriggerSheetState({ isOpen: false });
          }}
        />
      )}

      {actionSheetState && !isReadOnly && (
        <ActionSheet
          initialNode={actionSheetState.editNode}
          onClose={() => setActionSheetState(null)}
          onDelete={() => {
            if (actionSheetState.editNode) {
              const nodeId = actionSheetState.editNode.id;
              const newNodes = nodes.filter((n) => n.id !== nodeId);
              const newEdges = edges.filter((e) => e.source !== nodeId && e.target !== nodeId);
              setNodes(newNodes);
              setEdges(newEdges);
              saveGraphState(newNodes, newEdges);
              setActionSheetState(null);
            }
          }}
          onSelect={(type, name, description, metadata) => {
            let newNodes = [...nodes];
            let newEdges = [...edges];
            if (actionSheetState.editNode) {
              newNodes = nodes.map((n) =>
                n.id === actionSheetState.editNode!.id
                  ? { ...n, type, data: { ...n.data, name, description, metadata } }
                  : n,
              );
            } else {
              const newNodeId = Math.random().toString();
              newNodes.push({
                id: newNodeId,
                type,
                data: { name, description, kind: "action", metadata },
                position: actionSheetState.position || { x: 0, y: 0 },
              });
              const sourceId = actionSheetState.startingNodeId;
              if (sourceId) {
                newEdges.push({
                  id: `${sourceId}-${newNodeId}`,
                  source: sourceId,
                  target: newNodeId,
                });
              }
            }
            setNodes(newNodes);
            setEdges(newEdges);
            saveGraphState(newNodes, newEdges);
            setActionSheetState(null);
          }}
        />
      )}

      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onNodeClick={onNodeClick}
        defaultEdgeOptions={defaultEdgeOptions}
        nodesDraggable={!isReadOnly}
        nodesConnectable={!isReadOnly}
        elementsSelectable={!isReadOnly}
        fitView
      >
        <Background gap={16} size={1} />
        {!isReadOnly && (
          <Panel
            position="bottom-center"
            className="flex gap-4 mb-4 pointer-events-auto"
          >
            <div className="relative group flex items-center justify-center">
              <Button
                variant="default"
                className="gap-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-md px-4 h-10 font-medium disabled:opacity-100 disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none border border-transparent disabled:border-border"
                disabled={hasTrigger}
                onClick={() => setTriggerSheetState({ isOpen: true })}
              >
                <Plus className="w-4 h-4" /> Trigger
              </Button>
              <div className="absolute bottom-full mb-2 px-2 py-1 bg-foreground text-background text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-sm">
                {hasTrigger
                  ? "already created trigger node"
                  : "create a trigger node"}
              </div>
            </div>

            <div className="relative group flex items-center justify-center">
              <Button
                variant="default"
                className="gap-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg shadow-md px-4 h-10 font-medium"
                onClick={() =>
                  setActionSheetState({
                    position: {
                      x: window.innerWidth / 2 - 100,
                      y: window.innerHeight / 2 - 100,
                    },
                  })
                }
              >
                <Plus className="w-4 h-4" /> Action
              </Button>
              <div className="absolute bottom-full mb-2 px-2 py-1 bg-foreground text-background text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-sm">
                create an action node
              </div>
            </div>
          </Panel>
        )}
        {viewMode === "deployed" && (
          <Panel
            position="bottom-center"
            className="mb-4 pointer-events-auto"
          >
            <Button
              onClick={() => navigate(`/workflows/${display_id}/executions`)}
              className="gap-2 rounded-full h-11 px-6 shadow-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-bold transition-all border border-border"
            >
              <Activity className="w-4 h-4" />
              See Executions
            </Button>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}
