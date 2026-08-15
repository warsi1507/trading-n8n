import { useState, useCallback } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge, useReactFlow } from '@xyflow/react';
import type { OnNodesChange, OnEdgesChange, OnConnect, Node, Edge, OnConnectEnd } from '@xyflow/react';
import { TriggerSheet } from './TriggerSheet';
import { ActionSheet } from './ActionSheet';
import { PriceTrigger } from '@/nodes/triggers/PriceTrigger';
import { TimeTrigger } from '@/nodes/triggers/TimeTrigger';
import { Backpack } from '@/nodes/actions/Backpack';
import { Hyperliquid } from '@/nodes/actions/Hyperliquid';
import { Lighter } from '@/nodes/actions/Lighter';
import type { PriceTriggerMetadata, TimeTriggerMetadata, TradingMetadata } from '@trading-n8n/common';

export type NodeMetadata = PriceTriggerMetadata | TimeTriggerMetadata | TradingMetadata;

type NodeData = {
  kind: "action" | "trigger",
  metadata: NodeMetadata
};

export type AppNode = Node<NodeData>;

const nodeTypes = {
  "price-trigger": PriceTrigger,
  "time-trigger": TimeTrigger,
  "backpack": Backpack,
  "hyperliquid": Hyperliquid,
  "lighter": Lighter
}

export default function CreateWorkflow() {
  const [nodes, setNodes] = useState<AppNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isTriggerSheetOpen, setIsTriggerSheetOpen] = useState(true);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState<{ position: {x: number, y: number}, startingNodeId: string } | null>(null);
  
  const { screenToFlowPosition } = useReactFlow();

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

        setIsActionSheetOpen({
          position,
          startingNodeId: connectionState.fromNode.id
        });
      }
    },
    [screenToFlowPosition],
  );

  return (
    <div style={{width: '100vw', height: '100vh'}}>
      {isTriggerSheetOpen && !nodes.length && <TriggerSheet 
        onClose={() => setIsTriggerSheetOpen(false)}
        onSelect={(type, metadata) => {
        setNodes([...nodes, { 
          id: Math.random().toString(), 
          type: type,
          data: {
            kind: "trigger",
            metadata
          },
          position: {x:0, y:0}
        }])
      }}/>}
      
      {isActionSheetOpen && <ActionSheet 
        onClose={() => setIsActionSheetOpen(null)}
        onSelect={(type, metadata) => {
          const newNodeId = Math.random().toString();
          setNodes((nds) => [...nds, {
            id: newNodeId,
            type,
            data: {
              kind: "action",
              metadata
            },
            position: isActionSheetOpen.position
          }]);
          setEdges((eds) => [...eds, {
            id: `${isActionSheetOpen.startingNodeId}-${newNodeId}`,
            source: isActionSheetOpen.startingNodeId,
            target: newNodeId
          }]);
          setIsActionSheetOpen(null);
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
        fitView
      />
    </div>
  );
}
