import Redis from 'ioredis';
import { loadConfig } from '@/config.js';

export function createRedisConnection(): Redis.Redis {
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
