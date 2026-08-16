import { Schema, model } from "mongoose";
// 1. Strictly bound Node Schema
const nodeSchema = new Schema(
  {
    id: { type: String, required: true }, // ReactFlow ID
    type: { type: String, required: true },
    position: {
      x: { type: Number, required: true },
      y: { type: Number, required: true },
    },
    data: {
      name: { type: String, required: true },
      description: { type: String, required: true },
      kind: { type: String, enum: ["action", "trigger"], required: true },
      metadata: { type: Schema.Types.Mixed, required: true }, // Varies by node type
    },
  },
  { _id: false },
); // Disable mongoose from generating object ids for embedded nodes
// 2. Strictly bound Edge Schema
const edgeSchema = new Schema(
  {
    id: { type: String, required: true },
    source: { type: String, required: true },
    target: { type: String, required: true },
    sourceHandle: { type: String, default: null },
    targetHandle: { type: String, default: null },
  },
  { _id: false },
); // Disable object ids for embedded edges
// 3. Workflow Version Sub-Schema
const workflowVersionSchema = new Schema(
  {
    is_valid: { type: Boolean, required: true, default: false },
    nodes: [nodeSchema],
    edges: [edgeSchema],
  },
  { _id: false },
);
// 5. Main Workflow Schema
const workflowSchema = new Schema(
  {
    user_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
    display_id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    status: {
      type: String,
      enum: ["DRAFT", "DEPLOYED", "IN_EDIT"],
      required: true,
      default: "DRAFT",
    },
    is_active: { type: Boolean, required: true, default: false },
    draft_version: { type: workflowVersionSchema, required: true },
    deployed_version: { type: workflowVersionSchema, default: null },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  },
);
export const Workflow = model("Workflow", workflowSchema);
