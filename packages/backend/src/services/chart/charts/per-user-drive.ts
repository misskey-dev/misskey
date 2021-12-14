import autobind from 'autobind-decorator';
import Chart, { Obj, DeepPartial } from '../core';
import { SchemaType } from '@/misc/schema';
import { DriveFiles } from '@/models/index';
import { DriveFile } from '@/models/entities/drive-file';
import { name, schema } from './entities/per-user-drive';

type PerUserDriveLog = SchemaType<typeof schema>;

/**
 * ユーザーごとのドライブに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class PerUserDriveChart extends Chart<PerUserDriveLog> {
	constructor() {
		super(name, schema, true);
	}

	@autobind
	protected genNewLog(latest: PerUserDriveLog): DeepPartial<PerUserDriveLog> {
		return {
			totalCount: latest.totalCount,
			totalSize: latest.totalSize,
		};
	}

	@autobind
	protected aggregate(logs: PerUserDriveLog[]): PerUserDriveLog {
		return {
			totalCount: logs[0].totalCount,
			totalSize: logs[0].totalSize,
			incCount: logs.reduce((a, b) => a + b.incCount, 0),
			incSize: logs.reduce((a, b) => a + b.incSize, 0),
			decCount: logs.reduce((a, b) => a + b.decCount, 0),
			decSize: logs.reduce((a, b) => a + b.decSize, 0),
		};
	}

	@autobind
	protected async fetchActual(group: string): Promise<DeepPartial<PerUserDriveLog>> {
		const [count, size] = await Promise.all([
			DriveFiles.count({ userId: group }),
			DriveFiles.calcDriveUsageOf(group),
		]);

		return {
			totalCount: count,
			totalSize: size,
		};
	}

	@autobind
	public async update(file: DriveFile, isAdditional: boolean): Promise<void> {
		const update: Obj = {};

		update.totalCount = isAdditional ? 1 : -1;
		update.totalSize = isAdditional ? file.size : -file.size;
		if (isAdditional) {
			update.incCount = 1;
			update.incSize = file.size;
		} else {
			update.decCount = 1;
			update.decSize = file.size;
		}

		await this.inc(update, file.userId);
	}
}
