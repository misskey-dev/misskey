import * as Limiter from 'ratelimiter';
import * as debug from 'debug';
import limiterDB from '../db/redis';
import { IEndpoint } from './endpoints';
import { IAuthContext } from './authenticate';

const log = debug('misskey:limitter');

export default (endpoint: IEndpoint, ctx: IAuthContext) => new Promise((ok, reject) => {
	const limitKey = endpoint.hasOwnProperty('limitKey')
		? endpoint.limitKey
		: endpoint.name;

	const hasMinInterval =
		endpoint.hasOwnProperty('minInterval');

	const hasRateLimit =
		endpoint.hasOwnProperty('limitDuration') &&
		endpoint.hasOwnProperty('limitMax');

	if (hasMinInterval) {
		min();
	} else if (hasRateLimit) {
		max();
	} else {
		ok();
	}

	// Short-term limit
	function min() {
		const minIntervalLimiter = new Limiter({
			id: `${ctx.user._id}:${limitKey}:min`,
			duration: endpoint.minInterval,
			max: 1,
			db: limiterDB
		});

		minIntervalLimiter.get((err, info) => {
			if (err) {
				return reject('ERR');
			}

			log(`min remaining: ${info.remaining}`);

			if (info.remaining === 0) {
				reject('BRIEF_REQUEST_INTERVAL');
			} else {
				if (hasRateLimit) {
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
			id: `${ctx.user._id}:${limitKey}`,
			duration: endpoint.limitDuration,
			max: endpoint.limitMax,
			db: limiterDB
		});

		limiter.get((err, info) => {
			if (err) {
				return reject('ERR');
			}

			log(`max remaining: ${info.remaining}`);

			if (info.remaining === 0) {
				reject('RATE_LIMIT_EXCEEDED');
			} else {
				ok();
			}
		});
	}
});
