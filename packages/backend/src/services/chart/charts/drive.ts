import autobind from 'autobind-decorator';
import Chart, { DeepPartial, KVs } from '../core';
import { DriveFiles } from '@/models/index';
import { Not, IsNull } from 'typeorm';
import { DriveFile } from '@/models/entities/drive-file';
import { name, schema } from './entities/drive';

/**
 * ドライブに関するチャート
 */
// eslint-disable-next-line import/no-default-export
export default class DriveChart extends Chart<typeof schema> {
	constructor() {
		super(name, schema);
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
	protected async fetchActual(): Promise<DeepPartial<KVs<typeof schema>>> {
		return {};
	}

	@autobind
	public async update(file: DriveFile, isAdditional: boolean): Promise<void> {
		await this.commit(file.userHost === null ? {
			'local.incCount': isAdditional ? 1 : 0,
			'local.incSize': isAdditional ? file.size : 0,
			'local.decCount': isAdditional ? 0 : 1,
			'local.decSize': isAdditional ? 0 : file.size,
		} : {
			'remote.incCount': isAdditional ? 1 : 0,
			'remote.incSize': isAdditional ? file.size : 0,
			'remote.decCount': isAdditional ? 0 : 1,
			'remote.decSize': isAdditional ? 0 : file.size,
		});
	}
}
