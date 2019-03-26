import autobind from 'autobind-decorator';
import Chart, { Obj } from '../core';
import { SchemaType } from '../../../misc/schema';
import { DriveFiles } from '../../../models';
import { DriveFile } from '../../../models/entities/drive-file';

export const perUserDriveLogSchema = {
	type: 'object' as 'object',
	properties: {
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
	}
};

type PerUserDriveLog = SchemaType<typeof perUserDriveLogSchema>;

export default class PerUserDriveChart extends Chart<PerUserDriveLog> {
	constructor() {
		super('perUserDrive', perUserDriveLogSchema, true);
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
