import { Schema, model } from "mongoose";

/**
 * Core User entity for authentication and workflow ownership.
 */
export interface IUser {
  email: string;
  name: string;
  created_at: Date;
}

const userSchema = new Schema<IUser>({
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
  },
});

export const User = model<IUser>("User", userSchema);
