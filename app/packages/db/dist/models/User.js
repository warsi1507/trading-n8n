import { Schema, model } from 'mongoose';
const userSchema = new Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    created_at: { type: Date, default: Date.now }
});
export const User = model('User', userSchema);
