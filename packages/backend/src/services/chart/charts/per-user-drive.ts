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
			'totalCount': count,
			'totalSize': size,
		};
	}

	@autobind
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
