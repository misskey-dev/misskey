import Redis from 'ioredis';
import { loadConfig } from './built/config.js';

const config = loadConfig();
const redis = new Redis({
	port: config.redis.port,
	host: config.redis.host,
	family: config.redis.family == null ? 0 : config.redis.family,
	password: config.redis.pass,
	keyPrefix: `${config.redis.prefix}:`,
	db: config.redis.db ?? 0,
});

redis.on('connect', () => redis.disconnect());
redis.on('error', (e) => {
	throw e;
});
