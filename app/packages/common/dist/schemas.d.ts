import { z } from "zod";
/**
 * Validation schema for a node's XY position on the ReactFlow canvas.
 */
export declare const NodePositionSchema: z.ZodObject<{
    x: z.ZodNumber;
    y: z.ZodNumber;
}, z.core.$strip>;
/**
 * Core data payload schema for a workflow node.
 */
export declare const NodeDataSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodString;
    kind: z.ZodEnum<{
        action: "action";
        trigger: "trigger";
    }>;
    metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
}, z.core.$strip>;
/**
 * Validation schema for a complete ReactFlow Node.
 * Uses .passthrough() to safely allow internal ReactFlow DOM properties
 * (like dragging states) to pass through without being stripped.
 */
export declare const AppNodeSchema: z.ZodObject<{
    id: z.ZodString;
    type: z.ZodString;
    position: z.ZodObject<{
        x: z.ZodNumber;
        y: z.ZodNumber;
    }, z.core.$strip>;
    data: z.ZodObject<{
        name: z.ZodString;
        description: z.ZodString;
        kind: z.ZodEnum<{
            action: "action";
            trigger: "trigger";
        }>;
        metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
    }, z.core.$strip>;
    measured: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
    selected: z.ZodOptional<z.ZodBoolean>;
    dragging: z.ZodOptional<z.ZodBoolean>;
    width: z.ZodOptional<z.ZodNumber>;
    height: z.ZodOptional<z.ZodNumber>;
}, z.core.$loose>;
/**
 * Validation schema for a ReactFlow Edge connecting two nodes.
 */
export declare const AppEdgeSchema: z.ZodObject<{
    id: z.ZodString;
    source: z.ZodString;
    target: z.ZodString;
    sourceHandle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    targetHandle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
}, z.core.$loose>;
/**
 * Sub-schema validating a complete workflow graph state.
 */
export declare const WorkflowVersionSchema: z.ZodObject<{
    is_valid: z.ZodDefault<z.ZodBoolean>;
    nodes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        position: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strip>;
        data: z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            kind: z.ZodEnum<{
                action: "action";
                trigger: "trigger";
            }>;
            metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
        }, z.core.$strip>;
        measured: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        selected: z.ZodOptional<z.ZodBoolean>;
        dragging: z.ZodOptional<z.ZodBoolean>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
    }, z.core.$loose>>;
    edges: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        source: z.ZodString;
        target: z.ZodString;
        sourceHandle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        targetHandle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$loose>>;
}, z.core.$strip>;
/**
 * Payload validation for creating a new workflow.
 */
export declare const CreateWorkflowSchema: z.ZodObject<{
    name: z.ZodString;
    description: z.ZodDefault<z.ZodOptional<z.ZodString>>;
}, z.core.$strip>;
/**
 * Payload validation for saving a draft graph.
 */
export declare const SaveDraftSchema: z.ZodObject<{
    nodes: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        type: z.ZodString;
        position: z.ZodObject<{
            x: z.ZodNumber;
            y: z.ZodNumber;
        }, z.core.$strip>;
        data: z.ZodObject<{
            name: z.ZodString;
            description: z.ZodString;
            kind: z.ZodEnum<{
                action: "action";
                trigger: "trigger";
            }>;
            metadata: z.ZodRecord<z.ZodString, z.ZodAny>;
        }, z.core.$strip>;
        measured: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodAny>>;
        selected: z.ZodOptional<z.ZodBoolean>;
        dragging: z.ZodOptional<z.ZodBoolean>;
        width: z.ZodOptional<z.ZodNumber>;
        height: z.ZodOptional<z.ZodNumber>;
    }, z.core.$loose>>;
    edges: z.ZodArray<z.ZodObject<{
        id: z.ZodString;
        source: z.ZodString;
        target: z.ZodString;
        sourceHandle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
        targetHandle: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    }, z.core.$loose>>;
}, z.core.$strip>;
