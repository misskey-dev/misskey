import { createQueue } from 'kue';
import config from './conf';

export default createQueue({
	redis: {
		port: config.redis.port,
		host: config.redis.host,
		auth: config.redis.pass
	}
});
