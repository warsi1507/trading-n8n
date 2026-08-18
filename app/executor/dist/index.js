import dotenv from "dotenv";
import { connectDB } from "@trading-n8n/db";
dotenv.config();
async function startExecutor() {
    console.log("Starting Execution Engine...");
    const MONGO_URI = process.env.MONGO_URI;
    if (!MONGO_URI) {
        console.error("MONGO_URI is missing in environment.");
        process.exit(1);
    }
    await connectDB(MONGO_URI);
    console.log("Connected to Database.");
    console.log("Executor is running and waiting for workflows...");
    // TODO: Setup polling, cron jobs, or message queues to trigger executions
}
startExecutor().catch(console.error);
