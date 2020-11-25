import autobind from 'autobind-decorator';
import Chart, { Obj, DeepPartial } from '../../core';
import { SchemaType } from '../../../../misc/schema';
import { DriveFiles } from '../../../../models';
import { Not, IsNull } from 'typeorm';
import { DriveFile } from '../../../../models/entities/drive-file';
import { name, schema } from '../schemas/drive';

type DriveLog = SchemaType<typeof schema>;

export default class DriveChart extends Chart<DriveLog> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected genNewLog(latest: DriveLog): DeepPartial<DriveLog> {
		return {
			local: {
				totalCount: latest.local.totalCount,
				totalSize: latest.local.totalSize,
			},
			remote: {
				totalCount: latest.remote.totalCount,
				totalSize: latest.remote.totalSize,
			}
		};
	}

	@autobind
	protected async fetchActual(): Promise<DeepPartial<DriveLog>> {
		const [localCount, remoteCount, localSize, remoteSize] = await Promise.all([
			DriveFiles.count({ userHost: null }),
			DriveFiles.count({ userHost: Not(IsNull()) }),
			DriveFiles.calcDriveUsageOfLocal(),
			DriveFiles.calcDriveUsageOfRemote()
		]);

		return {
			local: {
				totalCount: localCount,
				totalSize: localSize,
			},
			remote: {
				totalCount: remoteCount,
				totalSize: remoteSize,
			}
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

		await this.inc({
			[file.userHost === null ? 'local' : 'remote']: update
		});
	}
}
