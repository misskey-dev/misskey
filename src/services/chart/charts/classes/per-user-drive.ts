import autobind from 'autobind-decorator';
import Chart, { Obj } from '../../core';
import { SchemaType } from '../../../../misc/schema';
import { DriveFiles } from '../../../../models';
import { DriveFile } from '../../../../models/entities/drive-file';
import { name, schema } from '../schemas/per-user-drive';

type PerUserDriveLog = SchemaType<typeof schema>;

export default class PerUserDriveChart extends Chart<PerUserDriveLog> {
	constructor() {
		super(name, schema, true);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: PerUserDriveLog, group?: string): Promise<PerUserDriveLog> {
		const [count, size] = init ? await Promise.all([
			DriveFiles.count({ userId: group }),
			DriveFiles.clacDriveUsageOf(group)
		]) : [
			latest ? latest.totalCount : 0,
			latest ? latest.totalSize : 0
		];

		return {
			totalCount: count,
			totalSize: size,
			incCount: 0,
			incSize: 0,
			decCount: 0,
			decSize: 0
		};
	}

	@autobind
	public async update(file: DriveFile, isAdditional: boolean) {
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
