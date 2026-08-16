import { Schema, model } from 'mongoose';
const counterSchema = new Schema({
    _id: { type: String, required: true },
    sequence_value: { type: Number, required: true }
});
export const Counter = model('Counter', counterSchema);
