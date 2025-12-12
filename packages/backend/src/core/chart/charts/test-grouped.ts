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
import { name, schema } from './entities/test-grouped.js';

/**
 * For testing
 */
@Injectable()
export default class TestGroupedChart extends Chart<typeof schema> { // eslint-disable-line import/no-default-export
	private total = {} as Record<string, number>;

	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		logger: Logger,
	) {
		super(db, (k) => acquireChartInsertLock(redisClient, k), logger, name, schema, true);
	}

	protected async tickMajor(group: string): Promise<Partial<KVs<typeof schema>>> {
		return {
			'foo.total': this.total[group],
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@bindThis
	public async increment(group: string): Promise<void> {
		if (this.total[group] == null) this.total[group] = 0;

		this.total[group]++;

		await this.commit({
			'foo.total': 1,
			'foo.inc': 1,
		}, group);
	}
}
