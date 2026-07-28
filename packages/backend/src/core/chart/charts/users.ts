/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { Not, IsNull, DataSource } from 'typeorm';
import * as Redis from 'ioredis';
import { MiUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { acquireChartInsertLock } from '@/misc/distributed-lock.js';
import Chart, { resyncQueryWithExtendedTimeout } from '../core.js';
import { ChartLoggerService } from '../ChartLoggerService.js';
import { name, schema } from './entities/users.js';
import type { KVs } from '../core.js';

/**
 * ユーザー数に関するチャート
 */
@Injectable()
export default class UsersChart extends Chart<typeof schema> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		private userEntityService: UserEntityService,
		private chartLoggerService: ChartLoggerService,
	) {
		super(db, (k) => acquireChartInsertLock(redisClient, k), chartLoggerService.logger, name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		// 大規模インスタンスでは user テーブルの全件 count も statement_timeout (10秒) を超過しうるため延長する
		const [localCount, remoteCount] = await resyncQueryWithExtendedTimeout(this.db, async em => [
			await em.countBy(MiUser, { host: IsNull() }),
			await em.countBy(MiUser, { host: Not(IsNull()) }),
		]);

		return {
			'local.total': localCount,
			'remote.total': remoteCount,
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@bindThis
	public async update(user: { id: MiUser['id'], host: MiUser['host'] }, isAdditional: boolean): Promise<void> {
		const prefix = this.userEntityService.isLocalUser(user) ? 'local' : 'remote';

		await this.commit({
			[`${prefix}.total`]: isAdditional ? 1 : -1,
			[`${prefix}.inc`]: isAdditional ? 1 : 0,
			[`${prefix}.dec`]: isAdditional ? 0 : 1,
		});
	}
}
