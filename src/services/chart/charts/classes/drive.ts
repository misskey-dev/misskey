import autobind from 'autobind-decorator';
import Chart, { Obj, DeepPartial } from '../../core';
import { SchemaType } from '../../../../misc/schema';
import { DriveFiles } from '../../../../models';
import { Not } from 'typeorm';
import { DriveFile } from '../../../../models/entities/drive-file';
import { name, schema } from '../schemas/drive';

type DriveLog = SchemaType<typeof schema>;

export default class DriveChart extends Chart<DriveLog> {
	constructor() {
		super(name, schema);
	}

	@autobind
	protected genNewLog(latest?: DriveLog): DriveLog {
		return {
			local: {
				totalCount: latest ? latest.local.totalCount : 0,
				totalSize: latest ? latest.local.totalSize : 0,
				incCount: 0,
				incSize: 0,
				decCount: 0,
				decSize: 0
			},
			remote: {
				totalCount: latest ? latest.remote.totalCount : 0,
				totalSize: latest ? latest.remote.totalSize : 0,
				incCount: 0,
				incSize: 0,
				decCount: 0,
				decSize: 0
			}
		};
	}

	@autobind
	protected async fetchActual(): Promise<DeepPartial<DriveLog>> {
		const [localCount, remoteCount, localSize, remoteSize] = await Promise.all([
			DriveFiles.count({ userHost: null }),
			DriveFiles.count({ userHost: Not(null) }),
			DriveFiles.clacDriveUsageOfLocal(),
			DriveFiles.clacDriveUsageOfRemote()
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
