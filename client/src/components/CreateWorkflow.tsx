import { useState, useCallback } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { OnNodesChange, OnEdgesChange, OnConnect, Node, Edge } from '@xyflow/react';
import { TriggerSheet } from './TriggerSheet';
import { PriceTrigger } from '@/nodes/triggers/PriceTrigger';
import { TimeTrigger } from '@/nodes/triggers/TimeTrigger';

export type NodeType = "price-trigger" | "time-trigger" | "hyperliquid" | "backpack" | "lighter"
export type NodeMetadata = any;

type NodeData = {
  kind: "action" | "trigger",
  metadata: NodeMetadata
};

export type AppNode = Node<NodeData>;

const nodeTypes = {
  "price-trigger": PriceTrigger,
  "time-trigger": TimeTrigger
}

export default function CreateWorkflow() {
  const [nodes, setNodes] = useState<AppNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isTriggerSheetOpen, setIsTriggerSheetOpen] = useState(true);

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
      <ReactFlow
        nodeTypes={nodeTypes}
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      />
    </div>
  );
}
