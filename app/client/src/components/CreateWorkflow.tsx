import { useState, useCallback } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, useReactFlow, Background, Panel, MarkerType } from '@xyflow/react';
import type { OnNodesChange, OnEdgesChange, OnConnect, Node, Edge, OnConnectEnd } from '@xyflow/react';
import { TriggerSheet } from './TriggerSheet';
import { ActionSheet } from './ActionSheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Play, Trash } from 'lucide-react';
import { PriceTrigger } from '@/nodes/triggers/PriceTrigger';
import { TimeTrigger } from '@/nodes/triggers/TimeTrigger';
import { Backpack } from '@/nodes/actions/Backpack';
import { Hyperliquid } from '@/nodes/actions/Hyperliquid';
import { Lighter } from '@/nodes/actions/Lighter';
import type { AppNode } from '@trading-n8n/common';

const nodeTypes = {
  "price-trigger": PriceTrigger,
  "time-trigger": TimeTrigger,
  "backpack": Backpack,
  "hyperliquid": Hyperliquid,
  "lighter": Lighter
}

const defaultEdgeOptions = {
  markerEnd: {
    type: MarkerType.ArrowClosed,
  },
};

export default function CreateWorkflow() {
  const [nodes, setNodes] = useState<AppNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [triggerSheetState, setTriggerSheetState] = useState<{ isOpen: boolean, editNode?: AppNode }>({ isOpen: false });
  const [actionSheetState, setActionSheetState] = useState<{ position?: {x: number, y: number}, startingNodeId?: string, editNode?: AppNode } | null>(null);
  
  const [workflowName, setWorkflowName] = useState("Untitled Workflow");
  const [workflowDescription, setWorkflowDescription] = useState("Add a description for your workflow here...");
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [tempName, setTempName] = useState("");
  const [tempDescription, setTempDescription] = useState("");
  
  const handleNameClick = () => { setTempName(workflowName); setIsEditingName(true); };
  const saveName = () => { setWorkflowName(tempName || "Untitled Workflow"); setIsEditingName(false); };
  
  const handleDescClick = () => { setTempDescription(workflowDescription); setIsEditingDescription(true); };
  const saveDesc = () => { setWorkflowDescription(tempDescription || "Add a description for your workflow here..."); setIsEditingDescription(false); };
  
  const { screenToFlowPosition } = useReactFlow();

  const hasTrigger = nodes.some(n => n.data.kind === "trigger");

  const onNodesChange: OnNodesChange<AppNode> = useCallback(
    (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
    [],
  );
  const onEdgesChange: OnEdgesChange = useCallback(
    (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
    [],
  );
  const onConnect: OnConnect = useCallback(
    (params) => setEdges((edgesSnapshot) => addEdge(params, edgesSnapshot)),
    [],
  );
  const onConnectEnd: OnConnectEnd = useCallback(
    (event, connectionState) => {
      if (!connectionState.isValid && connectionState.fromNode) {
        let clientX = 0;
        let clientY = 0;
        if ('clientX' in event) {
          clientX = (event as MouseEvent).clientX;
          clientY = (event as MouseEvent).clientY;
        } else if ('changedTouches' in event && (event as TouchEvent).changedTouches.length > 0) {
          clientX = (event as TouchEvent).changedTouches[0].clientX;
          clientY = (event as TouchEvent).changedTouches[0].clientY;
        }

        const position = screenToFlowPosition({ x: clientX, y: clientY });

        setActionSheetState({
          position,
          startingNodeId: connectionState.fromNode.id
        });
      }
    },
    [screenToFlowPosition],
  );

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const appNode = node as AppNode;
    if (appNode.data.kind === "trigger") {
      setTriggerSheetState({ isOpen: true, editNode: appNode });
    } else {
      setActionSheetState({ editNode: appNode });
    }
  }, []);

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 64px)', marginTop: '64px'}}>
      
      {/* Top Navigation Bar */}
      <div className="absolute top-4 left-4 right-4 z-50 pointer-events-none flex flex-row justify-between items-start gap-4">
        <div className="flex flex-col gap-1 w-full max-w-[800px] pointer-events-auto bg-background/60 backdrop-blur-xl p-3 px-4 rounded-xl border border-border/50 shadow-sm transition-all">
          {isEditingName ? (
            <Input 
              autoFocus
              value={tempName} 
              onChange={e => setTempName(e.target.value)} 
              onBlur={saveName}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              className="text-lg font-semibold bg-transparent border-none shadow-none h-auto p-0 focus-visible:ring-0 px-1 -ml-1 text-foreground"
            />
          ) : (
            <h1 onClick={handleNameClick} className="text-lg font-semibold cursor-text hover:text-primary transition-colors text-foreground px-1 -ml-1 truncate">
              {workflowName}
            </h1>
          )}
          
          {isEditingDescription ? (
            <div className="flex flex-col gap-2 mt-1 animate-in fade-in slide-in-from-top-1">
              <textarea 
                autoFocus
                value={tempDescription} 
                onChange={e => setTempDescription(e.target.value)} 
                className="w-full min-h-[80px] text-xs text-foreground bg-muted/50 p-2 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 border border-border/50"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveDesc} className="rounded-md h-7 px-3 text-xs">Save</Button>
                <Button size="sm" variant="ghost" onClick={() => setIsEditingDescription(false)} className="rounded-md h-7 px-3 text-xs">Cancel</Button>
              </div>
            </div>
          ) : (
            <p onClick={handleDescClick} className="text-xs text-muted-foreground cursor-text hover:text-foreground transition-colors line-clamp-2 px-1 -ml-1 mt-0.5">
              {workflowDescription}
            </p>
          )}
        </div>
        
        <div className="flex gap-2 pointer-events-auto mt-0.5 shrink-0">
          <Button disabled className="gap-1.5 rounded-lg h-8 px-4 shadow-sm bg-primary text-primary-foreground text-xs font-medium transition-all">
            <Play className="w-3 h-3" /> Deploy
          </Button>
          <Button variant="outline" disabled className="gap-1.5 rounded-lg h-8 px-4 border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-medium shadow-sm transition-all">
            <Trash className="w-3 h-3" /> Delete
          </Button>
        </div>
      </div>

      {triggerSheetState.isOpen && <TriggerSheet 
        initialNode={triggerSheetState.editNode}
        onClose={() => setTriggerSheetState({ isOpen: false })}
        onDelete={() => {
            if (triggerSheetState.editNode) {
                const nodeId = triggerSheetState.editNode.id;
                setNodes(nds => nds.filter(n => n.id !== nodeId));
                setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
                setTriggerSheetState({ isOpen: false });
            }
        }}
        onSelect={(type, name, description, metadata) => {
          if (triggerSheetState.editNode) {
            setNodes((nds) => nds.map(n => n.id === triggerSheetState.editNode!.id ? { ...n, type, data: { ...n.data, name, description, metadata } } : n));
          } else {
            setNodes((nds) => [...nds, { 
              id: Math.random().toString(), 
              type: type,
              data: { name, description, kind: "trigger", metadata },
              position: {x: 100, y: 100}
            }]);
          }
          setTriggerSheetState({ isOpen: false });
      }}/>}
      
      {actionSheetState && <ActionSheet 
        initialNode={actionSheetState.editNode}
        onClose={() => setActionSheetState(null)}
        onDelete={() => {
            if (actionSheetState.editNode) {
                const nodeId = actionSheetState.editNode.id;
                setNodes(nds => nds.filter(n => n.id !== nodeId));
                setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
                setActionSheetState(null);
            }
        }}
        onSelect={(type, name, description, metadata) => {
          if (actionSheetState.editNode) {
            setNodes((nds) => nds.map(n => n.id === actionSheetState.editNode!.id ? { ...n, type, data: { ...n.data, name, description, metadata } } : n));
          } else {
            const newNodeId = Math.random().toString();
            setNodes((nds) => [...nds, {
              id: newNodeId,
              type,
              data: { name, description, kind: "action", metadata },
              position: actionSheetState.position || { x: 0, y: 0 }
            }]);
            const sourceId = actionSheetState.startingNodeId;
            if (sourceId) {
              setEdges((eds) => [...eds, {
                id: `${sourceId}-${newNodeId}`,
                source: sourceId,
                target: newNodeId
              }]);
            }
          }
          setActionSheetState(null);
        }}
      />}

      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onConnectEnd={onConnectEnd}
        onNodeClick={onNodeClick}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
      >
        <Background gap={16} size={1} />
        <Panel position="bottom-center" className="flex gap-4 mb-4 pointer-events-auto">
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
              {hasTrigger ? "already created trigger node" : "create a trigger node"}
            </div>
          </div>
          
          <div className="relative group flex items-center justify-center">
            <Button 
              variant="default" 
              className="gap-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg shadow-md px-4 h-10 font-medium"
              onClick={() => setActionSheetState({ position: { x: window.innerWidth / 2 - 100, y: window.innerHeight / 2 - 100 } })}
            >
              <Plus className="w-4 h-4" /> Action
            </Button>
            <div className="absolute bottom-full mb-2 px-2 py-1 bg-foreground text-background text-[10px] font-medium rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-sm">
              create an action node
            </div>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
