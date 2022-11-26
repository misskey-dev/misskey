import { Inject, Injectable } from '@nestjs/common';
import Limiter from 'ratelimiter';
import Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import type Logger from '@/logger.js';
import { LoggerService } from '@/core/LoggerService.js';
import type { IEndpointMeta } from './endpoints.js';

@Injectable()
export class RateLimiterService {
	private logger: Logger;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		private loggerService: LoggerService,
	) {
		this.logger = this.loggerService.getLogger('limiter');
	}

	public limit(limitation: IEndpointMeta['limit'] & { key: NonNullable<string> }, actor: string) {
		return new Promise<void>((ok, reject) => {
			if (process.env.NODE_ENV === 'test') ok();
			
			// Short-term limit
			const min = (): void => {
				const minIntervalLimiter = new Limiter({
					id: `${actor}:${limitation.key}:min`,
					duration: limitation.minInterval,
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
					duration: limitation.duration,
					max: limitation.max,
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
