import { Schema, model, Types } from "mongoose";

export interface ICredential {
  user_id: Types.ObjectId;
  name: string;
  encrypted_value: string;
  iv: string;
  auth_tag: string;
  created_at: Date;
}

const credentialSchema = new Schema<ICredential>({
  user_id: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    immutable: true,
  },
  name: {
    type: String,
    required: true,
  },
  encrypted_value: {
    type: String,
    required: true,
    immutable: true,
  },
  iv: {
    type: String,
    required: true,
    immutable: true,
  },
  auth_tag: {
    type: String,
    required: true,
    immutable: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
    immutable: true,
  },
});

export const Credential = model<ICredential>("Credential", credentialSchema);
