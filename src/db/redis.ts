import * as redis from 'redis';

export default redis.createClient(
	config.redis.port,
	config.redis.host,
	{
		auth_pass: config.redis.pass
	}
);
