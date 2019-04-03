import autobind from 'autobind-decorator';
import Chart, { Obj, DeepPartial } from '../../core';
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
	protected genNewLog(latest?: PerUserDriveLog): PerUserDriveLog {
		return {
			totalCount: latest ? latest.totalCount : 0,
			totalSize: latest ? latest.totalSize : 0,
			incCount: 0,
			incSize: 0,
			decCount: 0,
			decSize: 0
		};
	}

	@autobind
	protected async fetchActual(group: string): Promise<DeepPartial<PerUserDriveLog>> {
		const [count, size] = await Promise.all([
			DriveFiles.count({ userId: group }),
			DriveFiles.clacDriveUsageOf(group)
		]);

		return {
			totalCount: count,
			totalSize: size,
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
