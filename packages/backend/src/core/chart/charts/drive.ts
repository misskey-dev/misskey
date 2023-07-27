/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { DriveFile } from '@/models/entities/DriveFile.js';
import { AppLockService } from '@/core/AppLockService.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import Chart from '../core.js';
import { ChartLoggerService } from '../ChartLoggerService.js';
import { name, schema } from './entities/drive.js';
import type { KVs } from '../core.js';

/**
 * ドライブに関するチャート
 */
// eslint-disable-next-line import/no-default-export
@Injectable()
export default class DriveChart extends Chart<typeof schema> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		private appLockService: AppLockService,
		private chartLoggerService: ChartLoggerService,
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
	public async update(file: DriveFile, isAdditional: boolean): Promise<void> {
		const fileSizeKb = file.size / 1000;
		await this.commit(file.userHost === null ? {
			'local.incCount': isAdditional ? 1 : 0,
			'local.incSize': isAdditional ? fileSizeKb : 0,
			'local.decCount': isAdditional ? 0 : 1,
			'local.decSize': isAdditional ? 0 : fileSizeKb,
		} : {
			'remote.incCount': isAdditional ? 1 : 0,
			'remote.incSize': isAdditional ? fileSizeKb : 0,
			'remote.decCount': isAdditional ? 0 : 1,
			'remote.decSize': isAdditional ? 0 : fileSizeKb,
		});
	}
}
