import * as Redis from 'ioredis';
import config from '@/config/index.js';

export function createConnection() {
	return new Redis({
		port: config.redis.port,
		host: config.redis.host,
		family: 0,
		password: config.redis.pass,
		db: config.redis.db || 0,
		keyPrefix: `${config.redis.prefix}:query:`,
	});
}

export const subsdcriber = createConnection();
subsdcriber.subscribe(config.host);

export const redisClient = createConnection();
