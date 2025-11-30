/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import { acquireApObjectLock, acquireChartInsertLock } from '@/misc/distributed-lock.js';
import { bindThis } from '@/decorators.js';

@Injectable()
export class AppLockService {
	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,
	) {
	}

	/**
	 * Get AP Object lock
	 * @param uri AP object ID
	 * @returns Unlock function
	 */
	@bindThis
	public getApLock(uri: string): Promise<() => Promise<void>> {
		return acquireApObjectLock(this.redisClient, uri);
	}

	/**
	 * Get chart insert lock
	 * @param lockKey Lock key
	 * @returns Unlock function
	 */
	@bindThis
	public getChartInsertLock(lockKey: string): Promise<() => Promise<void>> {
		return acquireChartInsertLock(this.redisClient, lockKey);
	}
}
