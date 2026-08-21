import { Redis } from 'ioredis';
import { createLogger } from '@trading-n8n/logger';

const logger = createLogger('REDIS');

let redis: Redis | null = null;

export const getRedisClient = (): Redis => {
  if (!redis) {
    const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
    redis = new Redis(url, {
      maxRetriesPerRequest: null,
    });
    
    redis.on('connect', () => {
      logger.info('Connected to Redis server successfully');
    });

    redis.on('error', (err) => {
      logger.error('Redis connection error', { error: err.message });
    });
  }
  return redis;
};
