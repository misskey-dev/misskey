import Redis from 'ioredis';
import { loadConfig } from './built/config.js';

const config = loadConfig();
const redis = new Redis(config.redis);

redis.on('connect', () => redis.disconnect());
redis.on('error', (e) => {
	throw e;
});
