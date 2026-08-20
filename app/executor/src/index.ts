import dotenv from "dotenv";
import { connectDB } from "@trading-n8n/db";
import { createLogger } from "@trading-n8n/logger";
import path from "path";

const logger = createLogger("EXECUTOR");

const envPath = path.resolve(process.cwd(), "../../.env");
dotenv.config({ path: envPath });

async function startExecutor() {
  logger.info("Starting Execution Engine...");
  
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    logger.error("MONGO_URI is missing in environment.");
    process.exit(1);
  }

  await connectDB(MONGO_URI);
  // Database connection is logged internally by db package
}

startExecutor().catch(e => logger.error("Fatal executor crash", { error: e.message }));
