import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '@trading-n8n/db';

import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

const app = express();
const PORT = process.env.PORT || 9000;
const MONGO_URI = process.env.MONGO_URI as string;

import webhookRoutes from './routes/webhooks';
import workflowRoutes from './routes/workflows';
import credentialsRoutes from './routes/credentials';
import executionRoutes from './routes/executions';

app.use(cors());

// webhook route must be registered BEFORE express.json() because svix needs the raw body
app.use('/api/webhooks', webhookRoutes);

import { startCronJobs } from './cron/archive';

app.use(express.json());

// Start background cron jobs
startCronJobs();

// Mount API routes
app.use('/api/workflows', workflowRoutes);
app.use('/api/credentials', credentialsRoutes);
app.use('/api/executions', executionRoutes);

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'Trading n8n (FlowTrade) API is running',
    timestamp: new Date().toISOString()
  });
});

import { createLogger } from '@trading-n8n/logger';

const logger = createLogger('API');

// Initialize DB and start server
const startServer = async () => {
  const API_URI = process.env.API_URI || `http://localhost:${PORT}`;
  app.listen(PORT, () => {
    logger.info(`Server running on ${API_URI}`);
  });
  
  try {
    await connectDB(MONGO_URI);
  } catch (error) {
    logger.error('Failed to connect to DB', { error: error instanceof Error ? error.message : error });
  }
};

startServer();
