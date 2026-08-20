import { Schema, model } from "mongoose";
/**
 * Sub-schema for ReactFlow nodes.
 * Strictly bound to AppNode type to ensure DB and frontend match.
 */
const nodeSchema = new Schema({
    id: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        required: true,
    },
    position: {
        x: {
            type: Number,
            required: true,
        },
        y: {
            type: Number,
            required: true,
        },
    },
    data: {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            default: "",
        },
        kind: {
            type: String,
            enum: ["action", "trigger"],
            required: true,
        },
        metadata: {
            type: Schema.Types.Mixed,
            required: true,
        },
    },
}, { _id: false });
/**
 * Sub-schema for ReactFlow edges.
 */
const edgeSchema = new Schema({
    id: {
        type: String,
        required: true,
    },
    source: {
        type: String,
        required: true,
    },
    target: {
        type: String,
        required: true,
    },
    sourceHandle: {
        type: String,
        default: null,
    },
    targetHandle: {
        type: String,
        default: null,
    },
}, { _id: false });
/**
 * Workflow version container embedding the nodes and edges graph.
 */
const workflowVersionSchema = new Schema({
    is_valid: {
        type: Boolean,
        required: true,
        default: false,
    },
    nodes: [nodeSchema],
    edges: [edgeSchema],
}, { _id: false });
/**
 * Main Workflow Schema containing embedded draft and deployed versions
 * for atomic deployment operations.
 */
const workflowSchema = new Schema({
    user_id: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
        immutable: true,
    },
    display_id: {
        type: String,
        required: true,
        unique: true,
        immutable: true,
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        default: "",
    },
    status: {
        type: String,
        enum: ["DRAFT", "DEPLOYED", "PAUSED"],
        required: true,
        default: "DRAFT",
    },
    is_active: {
        type: Boolean,
        required: true,
        default: false,
    },
    is_archived: {
        type: Boolean,
        required: true,
        default: false,
    },
    archived_at: {
        type: Date,
        default: null,
    },
    draft_version: {
        type: workflowVersionSchema,
        required: true,
    },
    deployed_version: {
        type: workflowVersionSchema,
        default: null,
    },
}, { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } });
workflowSchema.pre("save", function () {
    if (this.is_archived) {
        this.status = "DRAFT";
        this.is_active = false;
    }
    if (this.isModified("status") && this.status === "DEPLOYED") {
        if (!this.draft_version?.is_valid) {
            throw new Error("Database Lock: Cannot deploy a workflow that has not been validated.");
        }
    }
});
export const Workflow = model("Workflow", workflowSchema);
