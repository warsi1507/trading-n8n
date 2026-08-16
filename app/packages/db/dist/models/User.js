import { Schema, model } from "mongoose";
const userSchema = new Schema({
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
export const User = model("User", userSchema);
