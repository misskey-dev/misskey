import autobind from 'autobind-decorator';
import Chart, { Obj } from '../core';
import { SchemaType } from '../../../misc/schema';
import { DriveFiles, Followings, Users, Notes } from '../../../models';
import { DriveFile } from '../../../models/entities/drive-file';

/**
 * インスタンスごとのチャート
 */
export const instanceLogSchema = {
	type: 'object' as 'object',
	properties: {
		requests: {
			type: 'object' as 'object',
			properties: {
				failed: {
					type: 'number' as 'number',
					description: '失敗したリクエスト数'
				},
				succeeded: {
					type: 'number' as 'number',
					description: '成功したリクエスト数'
				},
				received: {
					type: 'number' as 'number',
					description: '受信したリクエスト数'
				},
			}
		},
		notes: {
			type: 'object' as 'object',
			properties: {
				total: {
					type: 'number' as 'number',
					description: '集計期間時点での、全投稿数'
				},
				inc: {
					type: 'number' as 'number',
					description: '増加した投稿数'
				},
				dec: {
					type: 'number' as 'number',
					description: '減少した投稿数'
				},
			}
		},
		users: {
			type: 'object' as 'object',
			properties: {
				total: {
					type: 'number' as 'number',
					description: '集計期間時点での、全ユーザー数'
				},
				inc: {
					type: 'number' as 'number',
					description: '増加したユーザー数'
				},
				dec: {
					type: 'number' as 'number',
					description: '減少したユーザー数'
				},
			}
		},
		following: {
			type: 'object' as 'object',
			properties: {
				total: {
					type: 'number' as 'number',
					description: '集計期間時点での、全フォロー数'
				},
				inc: {
					type: 'number' as 'number',
					description: '増加したフォロー数'
				},
				dec: {
					type: 'number' as 'number',
					description: '減少したフォロー数'
				},
			}
		},
		followers: {
			type: 'object' as 'object',
			properties: {
				total: {
					type: 'number' as 'number',
					description: '集計期間時点での、全フォロワー数'
				},
				inc: {
					type: 'number' as 'number',
					description: '増加したフォロワー数'
				},
				dec: {
					type: 'number' as 'number',
					description: '減少したフォロワー数'
				},
			}
		},
		drive: {
			type: 'object' as 'object',
			properties: {
				totalFiles: {
					type: 'number' as 'number',
					description: '集計期間時点での、全ドライブファイル数'
				},
				totalUsage: {
					type: 'number' as 'number',
					description: '集計期間時点での、全ドライブファイルの合計サイズ'
				},
				incFiles: {
					type: 'number' as 'number',
					description: '増加したドライブファイル数'
				},
				incUsage: {
					type: 'number' as 'number',
					description: '増加したドライブ使用量'
				},
				decFiles: {
					type: 'number' as 'number',
					description: '減少したドライブファイル数'
				},
				decUsage: {
					type: 'number' as 'number',
					description: '減少したドライブ使用量'
				},
			}
		},
	}
};

type InstanceLog = SchemaType<typeof instanceLogSchema>;

class InstanceChart extends Chart<InstanceLog> {
	constructor() {
		super('instance', instanceLogSchema);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: InstanceLog, group?: any): Promise<InstanceLog> {
		const calcUsage = DriveFiles.clacDriveUsageOfHost(group);

		const [
			notesCount,
			usersCount,
			followingCount,
			followersCount,
			driveFiles,
			driveUsage,
		] = init ? await Promise.all([
			Notes.count({ userHost: group }),
			Users.count({ host: group }),
			Followings.count({ followerHost: group }),
			Followings.count({ followeeHost: group }),
			DriveFiles.count({ userHost: group }),
			calcUsage,
		]) : [
			latest ? latest.notes.total : 0,
			latest ? latest.users.total : 0,
			latest ? latest.following.total : 0,
			latest ? latest.followers.total : 0,
			latest ? latest.drive.totalFiles : 0,
			latest ? latest.drive.totalUsage : 0,
		];

		return {
			requests: {
				failed: 0,
				succeeded: 0,
				received: 0
			},
			notes: {
				total: notesCount,
				inc: 0,
				dec: 0
			},
			users: {
				total: usersCount,
				inc: 0,
				dec: 0
			},
			following: {
				total: followingCount,
				inc: 0,
				dec: 0
			},
			followers: {
				total: followersCount,
				inc: 0,
				dec: 0
			},
			drive: {
				totalFiles: driveFiles,
				totalUsage: driveUsage,
				incFiles: 0,
				incUsage: 0,
				decFiles: 0,
				decUsage: 0
			}
		};
	}

	@autobind
	public async requestReceived(host: string) {
		await this.inc({
			requests: {
				received: 1
			}
		}, host);
	}

	@autobind
	public async requestSent(host: string, isSucceeded: boolean) {
		const update: Obj = {};

		if (isSucceeded) {
			update.succeeded = 1;
		} else {
			update.failed = 1;
		}

		await this.inc({
			requests: update
		}, host);
	}

	@autobind
	public async newUser(host: string) {
		await this.inc({
			users: {
				total: 1,
				inc: 1
			}
		}, host);
	}

	@autobind
	public async updateNote(host: string, isAdditional: boolean) {
		await this.inc({
			notes: {
				total: isAdditional ? 1 : -1,
				inc: isAdditional ? 1 : 0,
				dec: isAdditional ? 0 : 1,
			}
		}, host);
	}

	@autobind
	public async updateFollowing(host: string, isAdditional: boolean) {
		await this.inc({
			following: {
				total: isAdditional ? 1 : -1,
				inc: isAdditional ? 1 : 0,
				dec: isAdditional ? 0 : 1,
			}
		}, host);
	}

	@autobind
	public async updateFollowers(host: string, isAdditional: boolean) {
		await this.inc({
			followers: {
				total: isAdditional ? 1 : -1,
				inc: isAdditional ? 1 : 0,
				dec: isAdditional ? 0 : 1,
			}
		}, host);
	}

	@autobind
	public async updateDrive(file: DriveFile, isAdditional: boolean) {
		const update: Obj = {};

		update.totalFiles = isAdditional ? 1 : -1;
		update.totalUsage = isAdditional ? file.size : -file.size;
		if (isAdditional) {
			update.incFiles = 1;
			update.incUsage = file.size;
		} else {
			update.decFiles = 1;
			update.decUsage = file.size;
		}

		await this.inc({
			drive: update
		}, file.userHost);
	}
}

export default new InstanceChart();
