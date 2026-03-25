import { Redis } from 'ioredis'

const globalForRedis = globalThis as unknown as { redis: Redis | undefined }

function createRedisClient(): Redis {
  const client = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    enableOfflineQueue: false,
    lazyConnect: true,
  })

  client.on('error', (err) => {
    // Log but don't crash — Redis is a cache layer, not required for basic operation
    if (process.env.NODE_ENV !== 'test') {
      console.error('[redis] connection error:', err.message)
    }
  })

  return client
}

export const redis: Redis =
  globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
}
