import * as Limiter from 'ratelimiter';
import { redisClient } from '../../db/redis';
import { IEndpoint } from './endpoints';
import getAcct from '../../misc/acct/render';
import { User } from '../../models/entities/user';
import Logger from '../../services/logger';

const logger = new Logger('limiter');

export default (endpoint: IEndpoint, user: User) => new Promise((ok, reject) => {
	const limitation = endpoint.meta.limit!;

	const key = limitation.hasOwnProperty('key')
		? limitation.key
		: endpoint.name;

	const hasShortTermLimit =
		limitation.hasOwnProperty('minInterval');

	const hasLongTermLimit =
		limitation.hasOwnProperty('duration') &&
		limitation.hasOwnProperty('max');

	if (hasShortTermLimit) {
		min();
	} else if (hasLongTermLimit) {
		max();
	} else {
		ok();
	}

	// Short-term limit
	function min() {
		const minIntervalLimiter = new Limiter({
			id: `${user.id}:${key}:min`,
			duration: limitation.minInterval,
			max: 1,
			db: redisClient
		});

		minIntervalLimiter.get((err, info) => {
			if (err) {
				return reject('ERR');
			}

			logger.debug(`@${getAcct(user)} ${endpoint.name} min remaining: ${info.remaining}`);

			if (info.remaining === 0) {
				reject('BRIEF_REQUEST_INTERVAL');
			} else {
				if (hasLongTermLimit) {
					max();
				} else {
					ok();
				}
			}
		});
	}

	// Long term limit
	function max() {
		const limiter = new Limiter({
			id: `${user.id}:${key}`,
			duration: limitation.duration,
			max: limitation.max,
			db: redisClient
		});

		limiter.get((err, info) => {
			if (err) {
				return reject('ERR');
			}

			logger.debug(`@${getAcct(user)} ${endpoint.name} max remaining: ${info.remaining}`);

			if (info.remaining === 0) {
				reject('RATE_LIMIT_EXCEEDED');
			} else {
				ok();
			}
		});
	}
});
