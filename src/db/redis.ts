import * as redis from 'redis';
import config from '../config';

export default config.redis.map(({ host, port, pass }) => {
	return redis.createClient(port, host, {
		auth_pass: pass.getOrElse(null)
	});
}).getOrElse(null);
