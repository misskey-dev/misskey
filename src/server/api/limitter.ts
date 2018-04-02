import * as Limiter from 'ratelimiter';
import * as debug from 'debug';
import limiterDB from '../../db/redis';
import { Endpoint } from './endpoints';
import { IAuthContext } from './authenticate';
import getAcct from '../../acct/render';

const log = debug('misskey:limitter');

export default (endpoint: Endpoint, ctx: IAuthContext) => new Promise((ok, reject) => {
	const limitation = endpoint.limit;

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
			id: `${ctx.user._id}:${key}:min`,
			duration: limitation.minInterval,
			max: 1,
			db: limiterDB
		});

		minIntervalLimiter.get((err, info) => {
			if (err) {
				return reject('ERR');
			}

			log(`@${getAcct(ctx.user)} ${endpoint.name} min remaining: ${info.remaining}`);

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
			id: `${ctx.user._id}:${key}`,
			duration: limitation.duration,
			max: limitation.max,
			db: limiterDB
		});

		limiter.get((err, info) => {
			if (err) {
				return reject('ERR');
			}

			log(`@${getAcct(ctx.user)} ${endpoint.name} max remaining: ${info.remaining}`);

			if (info.remaining === 0) {
				reject('RATE_LIMIT_EXCEEDED');
			} else {
				ok();
			}
		});
	}
});
