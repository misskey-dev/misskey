/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import type * as Redis from 'ioredis';
import type { DataSource } from 'typeorm';
import type { DriveFileEntityService } from '@/core/entities/DriveFileEntityService.js';
import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import { acquireChartInsertLock } from '@/misc/distributed-lock.js';
import type { DriveFilesRepository } from '@/models/_.js';
import type { MiDriveFile } from '@/models/DriveFile.js';
import type { ChartLoggerService } from '../ChartLoggerService.js';
import type { KVs } from '../core.js';
import Chart from '../core.js';
import { name, schema } from './entities/per-user-drive.js';

/**
 * ユーザーごとのドライブに関するチャート
 */
@Injectable()
export default class PerUserDriveChart extends Chart<typeof schema> {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.driveFilesRepository)
		private driveFilesRepository: DriveFilesRepository,

		private driveFileEntityService: DriveFileEntityService,
		private chartLoggerService: ChartLoggerService,
	) {
		super(db, (k) => acquireChartInsertLock(redisClient, k), chartLoggerService.logger, name, schema, true);
	}

	protected async tickMajor(group: string): Promise<Partial<KVs<typeof schema>>> {
		const [count, size] = await Promise.all([
			this.driveFilesRepository.countBy({ userId: group }),
			this.driveFileEntityService.calcDriveUsageOf(group),
		]);

		return {
			'totalCount': count,
			'totalSize': size,
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	@bindThis
	public async update(file: MiDriveFile, isAdditional: boolean): Promise<void> {
		const fileSizeKb = file.size / 1000;
		await this.commit({
			'totalCount': isAdditional ? 1 : -1,
			'totalSize': isAdditional ? fileSizeKb : -fileSizeKb,
			'incCount': isAdditional ? 1 : 0,
			'incSize': isAdditional ? fileSizeKb : 0,
			'decCount': isAdditional ? 0 : 1,
			'decSize': isAdditional ? 0 : fileSizeKb,
		}, file.userId);
	}
}
