import Redis from 'ioredis';
import { loadConfig } from '@/config.js';

export function createConnection() {
	const config = loadConfig();

	return new Redis({
		port: config.redis.port,
		host: config.redis.host,
		family: config.redis.family == null ? 0 : config.redis.family,
		password: config.redis.pass,
		keyPrefix: `${config.redis.prefix}:`,
		db: config.redis.db ?? 0,
	});
}

export const redisSubscriber = createConnection();
redisSubscriber.subscribe(loadConfig().host);

export const redisClient = createConnection();
