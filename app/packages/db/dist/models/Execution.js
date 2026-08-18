import { Schema, model } from "mongoose";
const nodeExecutionSchema = new Schema({
    node_id: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["PENDING", "RUNNING", "SUCCESS", "FAILED", "SKIPPED"],
        required: true,
        default: "PENDING",
    },
    started_at: {
        type: Date,
    },
    ended_at: {
        type: Date,
    },
    output_data: {
        type: Schema.Types.Mixed,
    },
    error: {
        type: String,
    },
}, { _id: false });
const executionSchema = new Schema({
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
        enum: ["PENDING", "RUNNING", "SUCCESS", "FAILED"],
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
}, { timestamps: false });
export const Execution = model("Execution", executionSchema);
