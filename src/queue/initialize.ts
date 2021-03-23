import * as Queue from 'bull';
import config from '@/config';

export function initialize(name: string, limitPerSec = -1) {
	return new Queue(name, {
		redis: {
			port: config.redis.port,
			host: config.redis.host,
			password: config.redis.pass,
			db: config.redis.db || 0,
		},
		prefix: config.redis.prefix ? `${config.redis.prefix}:queue` : 'queue',
		limiter: limitPerSec > 0 ? {
			max: limitPerSec * 5,
			duration: 5000
		} : undefined
	});
}
