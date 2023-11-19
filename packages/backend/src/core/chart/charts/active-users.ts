/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { AppLockService } from '@/core/AppLockService.js';
import type { MiUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { IdService } from '@/core/IdService.js';
import Chart from '../core.js';
import { ChartLoggerService } from '../ChartLoggerService.js';
import { name, schema } from './entities/active-users.js';
import type { KVs } from '../core.js';

const week = 1000 * 60 * 60 * 24 * 7;
const month = 1000 * 60 * 60 * 24 * 30;
const year = 1000 * 60 * 60 * 24 * 365;

/**
 * アクティブユーザーに関するチャート
 */
@Injectable()
export default class ActiveUsersChart extends Chart<typeof schema> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		private appLockService: AppLockService,
		private chartLoggerService: ChartLoggerService,
		private idService: IdService,
	) {
		super(db, (k) => appLockService.getChartInsertLock(k), chartLoggerService.logger, name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@bindThis
	public async read(user: { id: MiUser['id'], host: null }): Promise<void> {
		const createdAt = this.idService.parse(user.id).date;
		await this.commit({
			'read': [user.id],
			'registeredWithinWeek': (Date.now() - createdAt.getTime() < week) ? [user.id] : [],
			'registeredWithinMonth': (Date.now() - createdAt.getTime() < month) ? [user.id] : [],
			'registeredWithinYear': (Date.now() - createdAt.getTime() < year) ? [user.id] : [],
			'registeredOutsideWeek': (Date.now() - createdAt.getTime() > week) ? [user.id] : [],
			'registeredOutsideMonth': (Date.now() - createdAt.getTime() > month) ? [user.id] : [],
			'registeredOutsideYear': (Date.now() - createdAt.getTime() > year) ? [user.id] : [],
		});
	}

	@bindThis
	public async write(user: { id: MiUser['id'], host: null }): Promise<void> {
		await this.commit({
			'write': [user.id],
		});
	}
}
