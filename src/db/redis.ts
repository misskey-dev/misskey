import * as redis from 'redis';
import config from '../config';

export default redis.createClient(
	config.redis.port,
	config.redis.host,
	{
		auth_pass: config.redis.pass
	}
);
