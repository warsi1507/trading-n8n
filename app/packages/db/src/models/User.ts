import { Schema, model } from "mongoose";

/**
 * Core User entity for authentication and workflow ownership.
 */
export interface IUser {
  clerk_id: string;
  email: string;
  name: string;
  created_at: Date;
}

const userSchema = new Schema<IUser>({
  clerk_id: {
    type: String,
    required: true,
    unique: true,
    index: true,
    immutable: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  name: {
    type: String,
    required: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

export const User = model<IUser>("User", userSchema);
