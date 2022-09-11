import { Injectable, Inject } from '@nestjs/common';
import { DriveFiles } from '@/models/index.js';
import type { DriveFile } from '@/models/entities/drive-file.js';
import type { AppLockService } from '@/services/AppLockService.js';
import { DI_SYMBOLS } from '@/di-symbols.js';
import Chart from '../core.js';
import { name, schema } from './entities/per-user-drive.js';
import type { KVs } from '../core.js';
import type { DataSource } from 'typeorm';

/**
 * ユーザーごとのドライブに関するチャート
 */
// eslint-disable-next-line import/no-default-export
@Injectable()
export default class PerUserDriveChart extends Chart<typeof schema> {
	constructor(
		@Inject(DI_SYMBOLS.db)
		private db: DataSource,

		private appLockService: AppLockService,
	) {
		super(db, appLockService.getChartInsertLock, name, schema, true);
	}

	protected async tickMajor(group: string): Promise<Partial<KVs<typeof schema>>> {
		const [count, size] = await Promise.all([
			DriveFiles.countBy({ userId: group }),
			DriveFiles.calcDriveUsageOf(group),
		]);

		return {
			'totalCount': count,
			'totalSize': size,
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		return {};
	}

	public async update(file: DriveFile, isAdditional: boolean): Promise<void> {
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
