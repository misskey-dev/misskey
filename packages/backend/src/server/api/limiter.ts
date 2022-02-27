import Limiter from 'ratelimiter';
import { redisClient } from '../../db/redis.js';
import { IEndpoint } from './endpoints.js';
import * as Acct from '@/misc/acct.js';
import { User } from '@/models/entities/user.js';
import Logger from '@/services/logger.js';

const logger = new Logger('limiter');

export const limiter = (endpoint: IEndpoint & { meta: { limit: NonNullable<IEndpoint['meta']['limit']> } }, user: User) => new Promise<void>((ok, reject) => {
	const limitation = endpoint.meta.limit;

	const key = Object.prototype.hasOwnProperty.call(limitation, 'key')
		? limitation.key
		: endpoint.name;

	const hasShortTermLimit =
		Object.prototype.hasOwnProperty.call(limitation, 'minInterval');

	const hasLongTermLimit =
		Object.prototype.hasOwnProperty.call(limitation, 'duration') &&
		Object.prototype.hasOwnProperty.call(limitation, 'max');

	if (hasShortTermLimit) {
		min();
	} else if (hasLongTermLimit) {
		max();
	} else {
		ok();
	}

	// Short-term limit
	function min(): void {
		const minIntervalLimiter = new Limiter({
			id: `${user.id}:${key}:min`,
			duration: limitation.minInterval,
			max: 1,
			db: redisClient,
		});

		minIntervalLimiter.get((err, info) => {
			if (err) {
				return reject('ERR');
			}

			logger.debug(`@${Acct.toString(user)} ${endpoint.name} min remaining: ${info.remaining}`);

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
	function max(): void {
		const limiter = new Limiter({
			id: `${user.id}:${key}`,
			duration: limitation.duration,
			max: limitation.max,
			db: redisClient,
		});

		limiter.get((err, info) => {
			if (err) {
				return reject('ERR');
			}

			logger.debug(`@${Acct.toString(user)} ${endpoint.name} max remaining: ${info.remaining}`);

			if (info.remaining === 0) {
				reject('RATE_LIMIT_EXCEEDED');
			} else {
				ok();
			}
		});
	}
});
