import autobind from 'autobind-decorator';
import Chart, { Obj, DeepPartial } from '../../core';
import { SchemaType } from '@/misc/schema';
import { DriveFiles } from '@/models/index';
import { Not, IsNull } from 'typeorm';
import { DriveFile } from '@/models/entities/drive-file';
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
	protected aggregate(logs: DriveLog[]): DriveLog {
		return {
			local: {
				totalCount: logs[0].local.totalCount,
				totalSize: logs[0].local.totalSize,
				incCount: logs.reduce((a, b) => a + b.local.incCount, 0),
				incSize: logs.reduce((a, b) => a + b.local.incSize, 0),
				decCount: logs.reduce((a, b) => a + b.local.decCount, 0),
				decSize: logs.reduce((a, b) => a + b.local.decSize, 0),
			},
			remote: {
				totalCount: logs[0].remote.totalCount,
				totalSize: logs[0].remote.totalSize,
				incCount: logs.reduce((a, b) => a + b.remote.incCount, 0),
				incSize: logs.reduce((a, b) => a + b.remote.incSize, 0),
				decCount: logs.reduce((a, b) => a + b.remote.decCount, 0),
				decSize: logs.reduce((a, b) => a + b.remote.decSize, 0),
			},
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
