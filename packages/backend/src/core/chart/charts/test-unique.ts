/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type * as Redis from 'ioredis';
import type { DataSource } from 'typeorm';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type Logger from '@/logger.js';
import { acquireChartInsertLock } from '@/misc/distributed-lock.js';
import type { KVs } from '../core.js';
import Chart from '../core.js';
import { name, schema } from './entities/test-unique.js';

/**
 * For testing
 */
@Injectable()
export default class TestUniqueChart extends Chart<typeof schema> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		logger: Logger,
	) {
		super(db, (k) => acquireChartInsertLock(redisClient, k), logger, name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@bindThis
	public async uniqueIncrement(key: string): Promise<void> {
		await this.commit({
			foo: [key],
		});
	}
}
