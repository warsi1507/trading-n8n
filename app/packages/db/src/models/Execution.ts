import { Schema, model, Types, Document } from "mongoose";
import type {
  ExecutionStatus,
  NodeExecutionStatus,
  INodeExecution,
} from "@trading-n8n/common";

const nodeExecutionSchema = new Schema<INodeExecution>(
  {
    node_id: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "RUNNING", "SUCCESS", "FAILED", "SKIPPED", "UNKNOWN"],
      required: true,
      default: "PENDING",
    },
    started_at: {
      type: Date,
    },
    ended_at: {
      type: Date,
    },
    duration_ms: {
      type: Number,
    },
    input_data: {
      type: Schema.Types.Mixed,
    },
    output_data: {
      type: Schema.Types.Mixed,
    },
    error: {
      type: String,
    },
  },
  { _id: false },
);

export interface IExecutionModel extends Document {
  display_id: string;
  workflow_id: Types.ObjectId;
  user_id: Types.ObjectId;
  status: ExecutionStatus;
  started_at: Date;
  ended_at?: Date;
  nodes: INodeExecution[];
}

const executionSchema = new Schema<IExecutionModel>(
  {
    display_id: {
      type: String,
      required: true,
    },
    workflow_id: {
      type: Schema.Types.ObjectId,
      ref: "Workflow",
      required: true,
      immutable: true,
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      immutable: true,
    },
    status: {
      type: String,
      enum: ["PENDING", "RUNNING", "SUCCESS", "FAILED", "CANCELED", "UNKNOWN"],
      required: true,
      default: "PENDING",
    },
    started_at: {
      type: Date,
      required: true,
      default: Date.now,
    },
    ended_at: {
      type: Date,
    },
    nodes: [nodeExecutionSchema],
  },
  { timestamps: false },
);

export const Execution = model<IExecutionModel>("Execution", executionSchema);
