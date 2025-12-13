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
import type { MiUser } from '@/models/User.js';
import type { ChartLoggerService } from '../ChartLoggerService.js';
import type { KVs } from '../core.js';
import Chart from '../core.js';
import { name, schema } from './entities/per-user-pv.js';

/**
 * ユーザーごとのプロフィール被閲覧数に関するチャート
 */
@Injectable()
export default class PerUserPvChart extends Chart<typeof schema> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		private chartLoggerService: ChartLoggerService,
	) {
		super(db, (k) => acquireChartInsertLock(redisClient, k), chartLoggerService.logger, name, schema, true);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@bindThis
	public async commitByUser(user: { id: MiUser['id'] }, key: string): Promise<void> {
		await this.commit({
			'upv.user': [key],
			'pv.user': 1,
		}, user.id);
	}

	@bindThis
	public async commitByVisitor(user: { id: MiUser['id'] }, key: string): Promise<void> {
		await this.commit({
			'upv.visitor': [key],
			'pv.visitor': 1,
		}, user.id);
	}
}
