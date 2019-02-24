import autobind from 'autobind-decorator';
import Chart, { Obj } from './';
import DriveFile, { IDriveFile } from '../../models/drive-file';
import { SchemaType } from '../../prelude/schema';

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

class PerUserDriveChart extends Chart<PerUserDriveLog> {
	constructor() {
		super('perUserDrive', true);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: PerUserDriveLog, group?: any): Promise<PerUserDriveLog> {
		const calcSize = () => DriveFile
			.aggregate([{
				$match: {
					'metadata.userId': group,
					'metadata.deletedAt': { $exists: false }
				}
			}, {
				$project: {
					length: true
				}
			}, {
				$group: {
					_id: null,
					usage: { $sum: '$length' }
				}
			}])
			.then(res => res.length > 0 ? res[0].usage : 0);

		const [count, size] = init ? await Promise.all([
			DriveFile.count({ 'metadata.userId': group }),
			calcSize()
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
	public async update(file: IDriveFile, isAdditional: boolean) {
		const update: Obj = {};

		update.totalCount = isAdditional ? 1 : -1;
		update.totalSize = isAdditional ? file.length : -file.length;
		if (isAdditional) {
			update.incCount = 1;
			update.incSize = file.length;
		} else {
			update.decCount = 1;
			update.decSize = file.length;
		}

		await this.inc(update, file.metadata.userId);
	}
}

export default new PerUserDriveChart();
