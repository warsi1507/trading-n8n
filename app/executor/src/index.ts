import dotenv from "dotenv";
import { connectDB } from "@trading-n8n/db";
import { createLogger } from "@trading-n8n/logger";
import path from "path";
import { getRedisClient } from "./redis/client";
import { MongoWorker } from "./redis/MongoWorker";
import { TriggerLoader } from "./cache/TriggerLoader";
import Redis from "ioredis";

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
  
  const redis = getRedisClient();
  await redis.ping();
  logger.info("Redis initialized");

  const worker = new MongoWorker();
  worker.start();

  // Load all deployed workflow data into memory
  await TriggerLoader.loadAllTriggers();

  // Subscribe to workflow change events published by the API server
  const subscriber = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
  await subscriber.subscribe('workflow:changed');

  subscriber.on('message', async (_channel: string, _message: string) => {
    logger.info('Received workflow change event, reloading triggers...');
    await TriggerLoader.loadAllTriggers();
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');
    worker.stop();
    subscriber.disconnect();
    redis.disconnect();
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);

  logger.info("Executor Sub-App fully started and listening...");
}

startExecutor().catch(e => logger.error("Fatal executor crash", { error: e.message }));
