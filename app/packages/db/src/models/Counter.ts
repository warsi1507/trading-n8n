import { Schema, model } from "mongoose";

/**
 * Counter sequence generator used for creating human-readable display IDs.
 * (e.g., 'workflow-1', 'workflow-2')
 */
export interface ICounter {
  _id: string;
  sequence_value: number;
}

const counterSchema = new Schema<ICounter>({
  _id: {
    type: String,
    required: true,
    immutable: true,
  },
  sequence_value: {
    type: Number,
    required: true,
  },
});

export const Counter = model<ICounter>("Counter", counterSchema);
