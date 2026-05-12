const Redis = require('ioredis');

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => {
    // Retry every 2 seconds max 10 times
    if (times > 10) {
      console.error('Redis connection failed after 10 retries');
      return null;
    }
    return Math.min(times * 200, 2000);
  }
});

redis.on('connect', () => {
  console.log('✅ Redis connected');
});

redis.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
});

module.exports = redis;