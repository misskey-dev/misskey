import Redis from 'ioredis';
import config from '@/config/index.js';

export function createConnection() {
	return new Redis({
		port: config.redis.port,
		host: config.redis.host,
		family: 0,
		password: config.redis.pass,
		keyPrefix: `${config.redis.prefix}:query:`,
		db: config.redis.db || 0,
	});
}

export const subsdcriber = createConnection();
subsdcriber.subscribe(config.host);

export const redisClient = createConnection();
