import autobind from 'autobind-decorator';
import Chart, { Obj } from './';
import DriveFile, { IDriveFile } from '../../models/drive-file';
import { isLocalUser } from '../../models/user';
import { SchemaType } from '../../prelude/schema';

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
		super('drive');
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: DriveLog): Promise<DriveLog> {
		const calcSize = (local: boolean) => DriveFile
			.aggregate([{
				$match: {
					'metadata._user.host': local ? null : { $ne: null },
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

		const [localCount, remoteCount, localSize, remoteSize] = init ? await Promise.all([
			DriveFile.count({ 'metadata._user.host': null }),
			DriveFile.count({ 'metadata._user.host': { $ne: null } }),
			calcSize(true),
			calcSize(false)
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

		await this.inc({
			[isLocalUser(file.metadata._user) ? 'local' : 'remote']: update
		});
	}
}

export default new DriveChart();
