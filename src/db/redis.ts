import * as redis from 'redis';
import config from '@/config/index';

export function createConnection() {
	return redis.createClient(
		config.redis.port,
		config.redis.host,
		{
			password: config.redis.pass,
			prefix: config.redis.prefix,
			db: config.redis.db || 0
		}
	);
}

export const subsdcriber = createConnection();
subsdcriber.subscribe(config.host);

export const redisClient = createConnection();
