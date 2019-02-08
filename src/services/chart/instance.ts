import autobind from 'autobind-decorator';
import Chart, { Obj } from '.';
import User from '../../models/user';
import Note from '../../models/note';
import Following from '../../models/following';
import DriveFile, { IDriveFile } from '../../models/drive-file';

/**
 * インスタンスごとのチャート
 */
type InstanceLog = {
	requests: {
		/**
		 * 失敗したリクエスト数
		 */
		failed: number;

		/**
		 * 成功したリクエスト数
		 */
		succeeded: number;

		/**
		 * 受信したリクエスト数
		 */
		received: number;
	};

	notes: {
		/**
		 * 集計期間時点での、全投稿数
		 */
		total: number;

		/**
		 * 増加した投稿数
		 */
		inc: number;

		/**
		 * 減少した投稿数
		 */
		dec: number;
	};

	users: {
		/**
		 * 集計期間時点での、全ユーザー数
		 */
		total: number;

		/**
		 * 増加したユーザー数
		 */
		inc: number;

		/**
		 * 減少したユーザー数
		 */
		dec: number;
	};

	following: {
		/**
		 * 集計期間時点での、全フォロー数
		 */
		total: number;

		/**
		 * 増加したフォロー数
		 */
		inc: number;

		/**
		 * 減少したフォロー数
		 */
		dec: number;
	};

	followers: {
		/**
		 * 集計期間時点での、全フォロワー数
		 */
		total: number;

		/**
		 * 増加したフォロワー数
		 */
		inc: number;

		/**
		 * 減少したフォロワー数
		 */
		dec: number;
	};

	drive: {
		/**
		 * 集計期間時点での、全ドライブファイル数
		 */
		totalFiles: number;

		/**
		 * 集計期間時点での、全ドライブファイルの合計サイズ
		 */
		totalUsage: number;

		/**
		 * 増加したドライブファイル数
		 */
		incFiles: number;

		/**
		 * 増加したドライブ使用量
		 */
		incUsage: number;

		/**
		 * 減少したドライブファイル数
		 */
		decFiles: number;

		/**
		 * 減少したドライブ使用量
		 */
		decUsage: number;
	};
};

class InstanceChart extends Chart<InstanceLog> {
	constructor() {
		super('instance', true);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: InstanceLog, group?: any): Promise<InstanceLog> {
		const calcUsage = () => DriveFile
			.aggregate([{
				$match: {
					'metadata._user.host': group,
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

		const [
			notesCount,
			usersCount,
			followingCount,
			followersCount,
			driveFiles,
			driveUsage,
		] = init ? await Promise.all([
			Note.count({ '_user.host': group }),
			User.count({ host: group }),
			Following.count({ '_follower.host': group }),
			Following.count({ '_followee.host': group }),
			DriveFile.count({ 'metadata._user.host': group }),
			calcUsage(),
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
	public async updateDrive(file: IDriveFile, isAdditional: boolean) {
		const update: Obj = {};

		update.totalFiles = isAdditional ? 1 : -1;
		update.totalUsage = isAdditional ? file.length : -file.length;
		if (isAdditional) {
			update.incFiles = 1;
			update.incUsage = file.length;
		} else {
			update.decFiles = 1;
			update.decUsage = file.length;
		}

		await this.inc({
			drive: update
		}, file.metadata._user.host);
	}
}

export default new InstanceChart();
