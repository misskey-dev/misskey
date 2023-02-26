import { loadConfig } from './built/config.js';
import { createRedisConnection } from './built/redis.js';

const config = loadConfig();
const redis = createRedisConnection(config);

redis.on('connect', () => redis.disconnect());
redis.on('error', (e) => {
	throw e;
});
