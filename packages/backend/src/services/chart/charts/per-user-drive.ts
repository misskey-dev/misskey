import autobind from 'autobind-decorator';
import Chart, { KVs } from '../core';
import { DriveFiles } from '@/models/index';
import { DriveFile } from '@/models/entities/drive-file';
import { name, schema } from './entities/per-user-drive';

/**
 * ユーザーごとのドライブに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class PerUserDriveChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema, true);
	}

	@autobind
	protected async queryCurrentState(group: string): Promise<Partial<KVs<typeof schema>>> {
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
