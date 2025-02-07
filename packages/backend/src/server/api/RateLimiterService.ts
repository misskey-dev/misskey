/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

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
		{
			if (this.disabled) {
				return Promise.resolve();
			}

			// Short-term limit
			const min = new Promise<void>((ok, reject) => {
				const minIntervalLimiter = new Limiter({
					id: `${actor}:${limitation.key}:min`,
					duration: limitation.minInterval! * factor,
					max: 1,
					db: this.redisClient,
				});

				minIntervalLimiter.get((err, info) => {
					if (err) {
						return reject({ code: 'ERR', info });
					}

					this.logger.debug(`${actor} ${limitation.key} min remaining: ${info.remaining}`);

					if (info.remaining === 0) {
						return reject({ code: 'BRIEF_REQUEST_INTERVAL', info });
					} else {
						if (hasLongTermLimit) {
							return max.then(ok, reject);
						} else {
							return ok();
						}
					}
				});
			});

			// Long term limit
			const max = new Promise<void>((ok, reject) => {
				const limiter = new Limiter({
					id: `${actor}:${limitation.key}`,
					duration: limitation.duration! * factor,
					max: limitation.max! / factor,
					db: this.redisClient,
				});

				limiter.get((err, info) => {
					if (err) {
						return reject({ code: 'ERR', info });
					}

					this.logger.debug(`${actor} ${limitation.key} max remaining: ${info.remaining}`);

					if (info.remaining === 0) {
						return reject({ code: 'RATE_LIMIT_EXCEEDED', info });
					} else {
						return ok();
					}
				});
			});

			const hasShortTermLimit = typeof limitation.minInterval === 'number';

			const hasLongTermLimit =
				typeof limitation.duration === 'number' &&
				typeof limitation.max === 'number';

			if (hasShortTermLimit) {
				return min;
			} else if (hasLongTermLimit) {
				return max;
			} else {
				return Promise.resolve();
			}
		}
	}
}
