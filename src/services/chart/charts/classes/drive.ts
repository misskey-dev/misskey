import autobind from 'autobind-decorator';
import Chart, { Obj } from '../../core';
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
	protected async getTemplate(init: boolean, latest?: DriveLog): Promise<DriveLog> {
		const [localCount, remoteCount, localSize, remoteSize] = init ? await Promise.all([
			DriveFiles.count({ userHost: null }),
			DriveFiles.count({ userHost: Not(null) }),
			DriveFiles.clacDriveUsageOfLocal(),
			DriveFiles.clacDriveUsageOfRemote()
		]) : [
			latest ? latest.local.totalCount : 0,
			latest ? latest.remote.totalCount : 0,
			latest ? latest.local.totalSize : 0,
			latest ? latest.remote.totalSize : 0
		];

		return {
			local: {
				totalCount: localCount,
				totalSize: localSize,
				incCount: 0,
				incSize: 0,
				decCount: 0,
				decSize: 0
			},
			remote: {
				totalCount: remoteCount,
				totalSize: remoteSize,
				incCount: 0,
				incSize: 0,
				decCount: 0,
				decSize: 0
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
