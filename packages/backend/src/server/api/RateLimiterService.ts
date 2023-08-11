import { Inject, Injectable } from '@nestjs/common';
import Limiter from 'ratelimiter';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import type Logger from '@/logger.js';
import { LoggerService } from '@/core/LoggerService.js';
import { bindThis } from '@/decorators.js';
import type { IEndpointMeta } from './endpoints.js';

@Injectable()
export class RateLimiterService {
	private logger: Logger;
	private disabled = false;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('limiter');

		if (process.env.NODE_ENV !== 'production') {
			this.disabled = true;
		}
	}

	@bindThis
	public limit(limitation: IEndpointMeta['limit'] & { key: NonNullable<string> }, actor: string, factor = 1) {
		return new Promise<void>((ok, reject) => {
			if (this.disabled) ok();

			// Short-term limit
			const min = (): void => {
				const minIntervalLimiter = new Limiter({
					id: `${actor}:${limitation.key}:min`,
					duration: limitation.minInterval! * factor,
					max: 1,
					db: this.redisClient,
				});
		
				minIntervalLimiter.get((err, info) => {
					if (err) {
						return reject('ERR');
					}
		
					this.logger.debug(`${actor} ${limitation.key} min remaining: ${info.remaining}`);
		
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
			};
		
			// Long term limit
			const max = (): void => {
				const limiter = new Limiter({
					id: `${actor}:${limitation.key}`,
					duration: limitation.duration! * factor,
					max: limitation.max! / factor,
					db: this.redisClient,
				});
		
				limiter.get((err, info) => {
					if (err) {
						return reject('ERR');
					}
		
					this.logger.debug(`${actor} ${limitation.key} max remaining: ${info.remaining}`);
		
					if (info.remaining === 0) {
						reject('RATE_LIMIT_EXCEEDED');
					} else {
						ok();
					}
				});
			};
		
			const hasShortTermLimit = typeof limitation.minInterval === 'number';
		
			const hasLongTermLimit =
				typeof limitation.duration === 'number' &&
				typeof limitation.max === 'number';
		
			if (hasShortTermLimit) {
				min();
			} else if (hasLongTermLimit) {
				max();
			} else {
				ok();
			}
		});
	}
}
