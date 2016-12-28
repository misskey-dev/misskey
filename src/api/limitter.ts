import * as Limiter from 'ratelimiter';
import limiterDB from '../db/redis';
import { IEndpoint } from './endpoints';
import { IAuthContext } from './authenticate';

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
	function min(): void {
		const minIntervalLimiter = new Limiter({
			id: `${ctx.user._id}:${limitKey}:min`,
			duration: endpoint.minInterval,
			max: 1,
			db: limiterDB
		});

		minIntervalLimiter.get((limitErr, limit) => {
			if (limitErr) {
				reject('ERR');
			} else if (limit.remaining === 0) {
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
	function max(): void {
		const limiter = new Limiter({
			id: `${ctx.user._id}:${limitKey}`,
			duration: endpoint.limitDuration,
			max: endpoint.limitMax,
			db: limiterDB
		});

		limiter.get((limitErr, limit) => {
			if (limitErr) {
				reject('ERR');
			} else if (limit.remaining === 0) {
				reject('RATE_LIMIT_EXCEEDED');
			} else {
				ok();
			}
		});
	}
});
