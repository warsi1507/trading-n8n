import { useState, useCallback } from 'react';
import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import type { OnNodesChange, OnEdgesChange, OnConnect, Node, Edge } from '@xyflow/react';
import { TriggerSheet } from './TriggerSheet';

export type Nodekind = "price-trigger" | "timer-trigger" | "hyperliquid" | "backpack" | "lighter"
export type NodeMetadata = any;

type NodeData = {
  type: "action" | "trigger",
  kind: Nodekind,
  metadata: NodeMetadata,
  label: String
};

type NodeType = Node<NodeData>;

export default function CreateWorkflow() {
  const [nodes, setNodes] = useState<NodeType[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isTriggerSheetOpen, setIsTriggerSheetOpen] = useState(true);

  const onNodesChange: OnNodesChange<NodeType> = useCallback(
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
        onSelect={(kind, metadata) => {
        setNodes([...nodes, { 
          id: Math.random().toString(), 
          data: {
            type: "trigger",
            kind,
            metadata,
            label: kind
          },
          position: {x:0, y:0}
        }])
      }}/>}
      <ReactFlow
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
