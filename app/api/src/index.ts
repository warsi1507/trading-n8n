import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from '@trading-n8n/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8525;
const MONGO_URI = process.env.MONGO_URI as string;

import webhookRoutes from './routes/webhooks';

app.use(cors());

// webhook route must be registered BEFORE express.json() because svix needs the raw body
app.use('/api/webhooks', webhookRoutes);

app.use(express.json());

// Health Check Route
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok',
    message: 'Trading n8n API is running',
    timestamp: new Date().toISOString()
  });
});

// Initialize DB and start server
const startServer = async () => {
  const API_URI = process.env.API_URI || `http://localhost:${PORT}`;
  app.listen(PORT, () => {
    console.log(`Server running on ${API_URI}`);
  });
  
  try {
    await connectDB(MONGO_URI);
  } catch (error) {
    console.error('Failed to connect to DB:', error);
  }
};

startServer();
