import define from '../define';
import { redisClient } from '../../../db/redis';
import config from '../../../config';

export const meta = {
	tags: ['meta'],

	requireCredential: false as const,

	params: {
	}
};

export default define(meta, (ps, user) => {
	return new Promise((res, rej) => {
		redisClient.pubsub('numsub', config.host, (_, x) => {
			res({
				count: x[1]
			});
		});
	});
});
