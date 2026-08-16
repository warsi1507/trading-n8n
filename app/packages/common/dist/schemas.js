import { z } from "zod";
/**
 * Validation schema for a node's XY position on the ReactFlow canvas.
 */
export const NodePositionSchema = z.object({
    x: z.number(),
    y: z.number(),
});
/**
 * Core data payload schema for a workflow node.
 */
export const NodeDataSchema = z.object({
    name: z.string(),
    description: z.string(),
    kind: z.enum(["action", "trigger"]),
    metadata: z.record(z.string(), z.any()),
});
/**
 * Validation schema for a complete ReactFlow Node.
 * Uses .passthrough() to safely allow internal ReactFlow DOM properties
 * (like dragging states) to pass through without being stripped.
 */
export const AppNodeSchema = z.object({
    id: z.string(),
    type: z.string(),
    position: NodePositionSchema,
    data: NodeDataSchema,
    measured: z.record(z.string(), z.any()).optional(),
    selected: z.boolean().optional(),
    dragging: z.boolean().optional(),
    width: z.number().optional(),
    height: z.number().optional(),
}).passthrough();
/**
 * Validation schema for a ReactFlow Edge connecting two nodes.
 */
export const AppEdgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string().nullable().optional(),
    targetHandle: z.string().nullable().optional(),
}).passthrough();
/**
 * Sub-schema validating a complete workflow graph state.
 */
export const WorkflowVersionSchema = z.object({
    is_valid: z.boolean().default(false),
    nodes: z.array(AppNodeSchema),
    edges: z.array(AppEdgeSchema),
});
/**
 * Payload validation for creating a new workflow.
 */
export const CreateWorkflowSchema = z.object({
    name: z.string().min(1, "Name is required").max(100, "Name is too long"),
    description: z.string().max(500).optional().default(""),
});
/**
 * Payload validation for saving a draft graph.
 */
export const SaveDraftSchema = z.object({
    nodes: z.array(AppNodeSchema),
    edges: z.array(AppEdgeSchema),
});
