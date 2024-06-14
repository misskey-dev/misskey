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
	private checkLimiter(options: Limiter.LimiterOption): Promise<Limiter.LimiterInfo> {
		return new Promise<Limiter.LimiterInfo>((resolve, reject) => {
			new Limiter(options).get((err, info) => {
				if (err) {
					return reject({ code: 'ERR', info });
				}
				resolve(info);
			});
		});
	}

	@bindThis
	public async limit(limitation: IEndpointMeta['limit'] & { key: NonNullable<string> }, actor: string, factor = 1) {
		if (this.disabled) {
			return;
		}

		// Short-term limit
		const min = async () => {
			const info = await this.checkLimiter({
				id: `${actor}:${limitation.key}:min`,
				duration: limitation.minInterval! * factor,
				max: 1,
				db: this.redisClient,
			});

			this.logger.debug(`${actor} ${limitation.key} min remaining: ${info.remaining}`);

			if (info.remaining === 0) {
				// eslint-disable-next-line no-throw-literal
				throw { code: 'BRIEF_REQUEST_INTERVAL', info };
			} else {
				if (hasLongTermLimit) {
					await max();
				} else {
					return;
				}
			}
		};

		// Long term limit
		const max = async () => {
			const info = await this.checkLimiter({
				id: `${actor}:${limitation.key}`,
				duration: limitation.duration! * factor,
				max: limitation.max! / factor,
				db: this.redisClient,
			});

			this.logger.debug(`${actor} ${limitation.key} max remaining: ${info.remaining}`);

			if (info.remaining === 0) {
				// eslint-disable-next-line no-throw-literal
				throw { code: 'RATE_LIMIT_EXCEEDED', info };
			} else {
				return;
			}
		};

		const hasShortTermLimit = typeof limitation.minInterval === 'number';

		const hasLongTermLimit =
			typeof limitation.duration === 'number' &&
			typeof limitation.max === 'number';

		if (hasShortTermLimit) {
			await min();
		} else if (hasLongTermLimit) {
			await max();
		} else {
			return;
		}
	}
}
