import Redis from 'ioredis';
import { Config } from '@/config.js';

export function createRedisConnection(config: Config): Redis.Redis {
	return new Redis({
		port: config.redis.port,
		host: config.redis.host,
		family: config.redis.family == null ? 0 : config.redis.family,
		password: config.redis.pass,
		keyPrefix: `${config.redis.prefix}:`,
		db: config.redis.db ?? 0,
	});
}
