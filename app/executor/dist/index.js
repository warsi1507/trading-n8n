"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("@trading-n8n/db");
dotenv_1.default.config();
async function startExecutor() {
    console.log("Starting Execution Engine...");
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error("MONGO_URI is missing in environment.");
        process.exit(1);
    }
    await (0, db_1.connectDB)(MONGO_URI);
    console.log("Connected to Database.");
    console.log("Executor is running and waiting for workflows...");
    // TODO: Setup polling, cron jobs, or message queues to trigger executions
}
startExecutor().catch(console.error);
