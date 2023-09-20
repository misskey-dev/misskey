/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { MiUser } from '@/models/User.js';
import type { MiNote } from '@/models/Note.js';
import { AppLockService } from '@/core/AppLockService.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import Chart from '../core.js';
import { ChartLoggerService } from '../ChartLoggerService.js';
import { name, schema } from './entities/per-user-reactions.js';
import type { KVs } from '../core.js';

/**
 * ユーザーごとのリアクションに関するチャート
 */
@Injectable()
export default class PerUserReactionsChart extends Chart<typeof schema> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		private appLockService: AppLockService,
		private userEntityService: UserEntityService,
		private chartLoggerService: ChartLoggerService,
	) {
		super(db, (k) => appLockService.getChartInsertLock(k), chartLoggerService.logger, name, schema, true);
	}

	protected async tickMajor(group: string): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@bindThis
	public async update(user: { id: MiUser['id'], host: MiUser['host'] }, note: MiNote): Promise<void> {
		const prefix = this.userEntityService.isLocalUser(user) ? 'local' : 'remote';
		this.commit({
			[`${prefix}.count`]: 1,
		}, note.userId);
	}
}
