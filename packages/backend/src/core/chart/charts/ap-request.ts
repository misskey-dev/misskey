/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type * as Redis from 'ioredis';
import type { DataSource } from 'typeorm';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import { acquireChartInsertLock } from '@/misc/distributed-lock.js';
import type { ChartLoggerService } from '../ChartLoggerService.js';
import type { KVs } from '../core.js';
import Chart from '../core.js';
import { name, schema } from './entities/ap-request.js';

/**
 * Chart about ActivityPub requests
 */
@Injectable()
export default class ApRequestChart extends Chart<typeof schema> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		private chartLoggerService: ChartLoggerService,
	) {
		super(db, (k) => acquireChartInsertLock(redisClient, k), chartLoggerService.logger, name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@bindThis
	public async deliverSucc(): Promise<void> {
		await this.commit({
			'deliverSucceeded': 1,
		});
	}

	@bindThis
	public async deliverFail(): Promise<void> {
		await this.commit({
			'deliverFailed': 1,
		});
	}

	@bindThis
	public async inbox(): Promise<void> {
		await this.commit({
			'inboxReceived': 1,
		});
	}
}
