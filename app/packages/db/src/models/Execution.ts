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
      type: Schema.Types.Mixed,
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
  duration_ms?: number;
  nodes: INodeExecution[];
  workflow_deleted?: boolean;
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
    duration_ms: {
      type: Number,
    },
    workflow_deleted: {
      type: Boolean,
      default: false,
    },
    nodes: [nodeExecutionSchema],
  },
  { timestamps: false },
);

executionSchema.pre("save", async function () {
  if (this.isNew) {
    const Workflow = this.db.model("Workflow");
    const workflow = await Workflow.findById(this.workflow_id);
    if (!workflow) {
      throw new Error("Workflow not found for this execution.");
    }
    if (workflow.status !== "DEPLOYED" && workflow.status !== "PAUSED") {
      throw new Error(`Cannot create execution. Workflow is in status: ${workflow.status}. Only DEPLOYED or PAUSED workflows can execute.`);
    }
  } else {
    // Prevent modifications if the execution was already in a terminal state
    const original = await this.collection.findOne({ _id: this._id });
    if (original && ["SUCCESS", "FAILED", "CANCELED"].includes(original.status)) {
      throw new Error(`Immutability lock: Cannot modify execution ${this.display_id} because it is already in a terminal state (${original.status}).`);
    }
  }
});

export const Execution = model<IExecutionModel>("Execution", executionSchema);
