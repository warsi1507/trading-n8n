import { Schema, model } from "mongoose";
const credentialSchema = new Schema({
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
export const Credential = model("Credential", credentialSchema);
