import autobind from 'autobind-decorator';
import Chart, { Obj } from '../core';
import { SchemaType } from '../../../misc/schema';
import { DriveFiles } from '../../../models';
import { Not } from 'typeorm';
import { DriveFile } from '../../../models/entities/drive-file';

const logSchema = {
	/**
	 * 集計期間時点での、全ドライブファイル数
	 */
	totalCount: {
		type: 'number' as 'number',
		description: '集計期間時点での、全ドライブファイル数'
	},

	/**
	 * 集計期間時点での、全ドライブファイルの合計サイズ
	 */
	totalSize: {
		type: 'number' as 'number',
		description: '集計期間時点での、全ドライブファイルの合計サイズ'
	},

	/**
	 * 増加したドライブファイル数
	 */
	incCount: {
		type: 'number' as 'number',
		description: '増加したドライブファイル数'
	},

	/**
	 * 増加したドライブ使用量
	 */
	incSize: {
		type: 'number' as 'number',
		description: '増加したドライブ使用量'
	},

	/**
	 * 減少したドライブファイル数
	 */
	decCount: {
		type: 'number' as 'number',
		description: '減少したドライブファイル数'
	},

	/**
	 * 減少したドライブ使用量
	 */
	decSize: {
		type: 'number' as 'number',
		description: '減少したドライブ使用量'
	},
};

export const driveLogSchema = {
	type: 'object' as 'object',
	properties: {
		local: {
			type: 'object' as 'object',
			properties: logSchema
		},
		remote: {
			type: 'object' as 'object',
			properties: logSchema
		},
	}
};

type DriveLog = SchemaType<typeof driveLogSchema>;

class DriveChart extends Chart<DriveLog> {
	constructor() {
		super('drive', driveLogSchema);
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

export default new DriveChart();
