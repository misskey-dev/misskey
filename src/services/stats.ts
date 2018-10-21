/**
 * このファイルでは、チャートに関する処理を行います。
 */

const nestedProperty = require('nested-property');
import autobind from 'autobind-decorator';
import * as mongo from 'mongodb';
import db from '../db/mongodb';
import Note, { INote } from '../models/note';
import User, { isLocalUser, IUser } from '../models/user';
import DriveFile, { IDriveFile } from '../models/drive-file';
import { ICollection } from 'monk';
import Following from '../models/following';

type Obj = { [key: string]: any };

type Partial<T> = {
	[P in keyof T]?: Partial<T[P]>;
};

type ArrayValue<T> = {
	[P in keyof T]: T[P] extends number ? Array<T[P]> : ArrayValue<T[P]>;
};

type Span = 'day' | 'hour';

//#region Chart Core
type Log<T extends Obj> = {
	_id: mongo.ObjectID;

	/**
	 * 集計のグループ
	 */
	group?: any;

	/**
	 * 集計日時
	 */
	date: Date;

	/**
	 * 集計期間
	 */
	span: Span;

	/**
	 * データ
	 */
	data: T;

	/**
	 * ユニークインクリメント用
	 */
	unique?: Obj;
};

/**
 * 様々なチャートの管理を司るクラス
 */
abstract class Stats<T> {
	protected collection: ICollection<Log<T>>;
	protected abstract async getTemplate(init: boolean, latest?: T, group?: any): Promise<T>;

	constructor(name: string, grouped = false) {
		this.collection = db.get<Log<T>>(`stats.${name}`);
		if (grouped) {
			this.collection.createIndex({ span: -1, date: -1, group: -1 }, { unique: true });
		} else {
			this.collection.createIndex({ span: -1, date: -1 }, { unique: true });
		}
	}

	@autobind
	private convertQuery(x: Obj, path: string): Obj {
		const query: Obj = {};

		const dive = (x: Obj, path: string) => {
			Object.entries(x).forEach(([k, v]) => {
				const p = path ? `${path}.${k}` : k;
				if (typeof v === 'number') {
					query[p] = v;
				} else {
					dive(v, p);
				}
			});
		};

		dive(x, path);

		return query;
	}

	@autobind
	private async getCurrentLog(span: Span, group?: any): Promise<Log<T>> {
		const now = new Date();
		const y = now.getFullYear();
		const m = now.getMonth();
		const d = now.getDate();
		const h = now.getHours();

		const current =
			span == 'day' ? new Date(y, m, d) :
			span == 'hour' ? new Date(y, m, d, h) :
			null;

		// 現在(今日または今のHour)の統計
		const currentLog = await this.collection.findOne({
			group: group,
			span: span,
			date: current
		});

		if (currentLog) {
			return currentLog;
		}

		// 集計期間が変わってから、初めてのチャート更新なら
		// 最も最近の統計を持ってくる
		// * 例えば集計期間が「日」である場合で考えると、
		// * 昨日何もチャートを更新するような出来事がなかった場合は、
		// * 統計がそもそも作られずドキュメントが存在しないということがあり得るため、
		// * 「昨日の」と決め打ちせずに「もっとも最近の」とします
		const latest = await this.collection.findOne({
			group: group,
			span: span
		}, {
			sort: {
				date: -1
			}
		});

		if (latest) {
			// 現在の統計を初期挿入
			const data = await this.getTemplate(false, latest.data);

			const log = await this.collection.insert({
				group: group,
				span: span,
				date: current,
				data: data
			});

			return log;
		} else {
			// 統計が存在しなかったら
			// * Misskeyインスタンスを建てて初めてのチャート更新時など

			// 空の統計を作成
			const data = await this.getTemplate(true, null, group);

			const log = await this.collection.insert({
				group: group,
				span: span,
				date: current,
				data: data
			});

			return log;
		}
	}

	@autobind
	protected commit(query: Obj, group?: any, uniqueKey?: string, uniqueValue?: string): void {
		const update = (log: Log<T>) => {
			// ユニークインクリメントの場合、指定のキーに指定の値が既に存在していたら弾く
			if (
				uniqueKey &&
				log.unique &&
				log.unique[uniqueKey] &&
				log.unique[uniqueKey].includes(uniqueValue)
			) return;

			// ユニークインクリメントの指定のキーに値を追加
			if (uniqueKey) {
				query['$push'] = {
					[`unique.${uniqueKey}`]: uniqueValue
				};
			}

			this.collection.update({
				_id: log._id
			}, query);
		};

		this.getCurrentLog('day', group).then(log => update(log));
		this.getCurrentLog('hour', group).then(log => update(log));
	}

	@autobind
	protected inc(inc: Partial<T>, group?: any): void {
		this.commit({
			$inc: this.convertQuery(inc, 'data')
		}, group);
	}

	@autobind
	protected incIfUnique(inc: Partial<T>, key: string, value: string, group?: any): void {
		this.commit({
			$inc: this.convertQuery(inc, 'data')
		}, group, key, value);
	}

	@autobind
	public async getChart(span: Span, range: number, group?: any): Promise<ArrayValue<T>> {
		const promisedChart: Promise<T>[] = [];

		const now = new Date();
		const y = now.getFullYear();
		const m = now.getMonth();
		const d = now.getDate();
		const h = now.getHours();

		const gt =
			span == 'day' ? new Date(y, m, d - range) :
			span == 'hour' ? new Date(y, m, d, h - range) : null;

		const logs = await this.collection.find({
			group: group,
			span: span,
			date: {
				$gt: gt
			}
		}, {
			sort: {
				date: -1
			},
			fields: {
				_id: 0
			}
		});

		for (let i = (range - 1); i >= 0; i--) {
			const current =
				span == 'day' ? new Date(y, m, d - i) :
				span == 'hour' ? new Date(y, m, d, h - i) :
				null;

			const log = logs.find(l => l.date.getTime() == current.getTime());

			if (log) {
				promisedChart.unshift(Promise.resolve(log.data));
			} else { // 隙間埋め
				const latest = logs.find(l => l.date.getTime() < current.getTime());
				promisedChart.unshift(this.getTemplate(false, latest ? latest.data : null));
			}
		}

		const chart = await Promise.all(promisedChart);

		const res: ArrayValue<T> = {} as any;

		/**
		 * [{
		 * 	xxxxx: 1,
		 * 	yyyyy: 5
		 * }, {
		 * 	xxxxx: 2,
		 * 	yyyyy: 6
		 * }, {
		 * 	xxxxx: 3,
		 * 	yyyyy: 7
		 * }]
		 *
		 * を
		 *
		 * {
		 * 	xxxxx: [1, 2, 3],
		 * 	yyyyy: [5, 6, 7]
		 * }
		 *
		 * にする
		 */
		const dive = (x: Obj, path?: string) => {
			Object.entries(x).forEach(([k, v]) => {
				const p = path ? `${path}.${k}` : k;
				if (typeof v == 'object') {
					dive(v, p);
				} else {
					nestedProperty.set(res, p, chart.map(s => nestedProperty.get(s, p)));
				}
			});
		};

		dive(chart[0]);

		return res;
	}
}
//#endregion

//#region Users stats
/**
 * ユーザーに関する統計
 */
type UsersLog = {
	local: {
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

	remote: UsersLog['local'];
};

class UsersStats extends Stats<UsersLog> {
	constructor() {
		super('users');
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: UsersLog): Promise<UsersLog> {
		const [localCount, remoteCount] = init ? await Promise.all([
			User.count({ host: null }),
			User.count({ host: { $ne: null } })
		]) : [
			latest ? latest.local.total : 0,
			latest ? latest.remote.total : 0
		];

		return {
			local: {
				total: localCount,
				inc: 0,
				dec: 0
			},
			remote: {
				total: remoteCount,
				inc: 0,
				dec: 0
			}
		};
	}

	@autobind
	public async update(user: IUser, isAdditional: boolean) {
		const update: Obj = {};

		update.total = isAdditional ? 1 : -1;
		if (isAdditional) {
			update.inc = 1;
		} else {
			update.dec = 1;
		}

		await this.inc({
			[isLocalUser(user) ? 'local' : 'remote']: update
		});
	}
}

export const usersStats = new UsersStats();
//#endregion

//#region Notes stats
/**
 * 投稿に関する統計
 */
type NotesLog = {
	local: {
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

		diffs: {
			/**
			 * 通常の投稿数の差分
			 */
			normal: number;

			/**
			 * リプライの投稿数の差分
			 */
			reply: number;

			/**
			 * Renoteの投稿数の差分
			 */
			renote: number;
		};
	};

	remote: NotesLog['local'];
};

class NotesStats extends Stats<NotesLog> {
	constructor() {
		super('notes');
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: NotesLog): Promise<NotesLog> {
		const [localCount, remoteCount] = init ? await Promise.all([
			Note.count({ '_user.host': null }),
			Note.count({ '_user.host': { $ne: null } })
		]) : [
			latest ? latest.local.total : 0,
			latest ? latest.remote.total : 0
		];

		return {
			local: {
				total: localCount,
				inc: 0,
				dec: 0,
				diffs: {
					normal: 0,
					reply: 0,
					renote: 0
				}
			},
			remote: {
				total: remoteCount,
				inc: 0,
				dec: 0,
				diffs: {
					normal: 0,
					reply: 0,
					renote: 0
				}
			}
		};
	}

	@autobind
	public async update(note: INote, isAdditional: boolean) {
		const update: Obj = {
			diffs: {}
		};

		update.total = isAdditional ? 1 : -1;

		if (isAdditional) {
			update.inc = 1;
		} else {
			update.dec = 1;
		}

		if (note.replyId != null) {
			update.diffs.reply = isAdditional ? 1 : -1;
		} else if (note.renoteId != null) {
			update.diffs.renote = isAdditional ? 1 : -1;
		} else {
			update.diffs.normal = isAdditional ? 1 : -1;
		}

		await this.inc({
			[isLocalUser(note._user) ? 'local' : 'remote']: update
		});
	}
}

export const notesStats = new NotesStats();
//#endregion

//#region Drive stats
/**
 * ドライブに関する統計
 */
type DriveLog = {
	local: {
		/**
		 * 集計期間時点での、全ドライブファイル数
		 */
		totalCount: number;

		/**
		 * 集計期間時点での、全ドライブファイルの合計サイズ
		 */
		totalSize: number;

		/**
		 * 増加したドライブファイル数
		 */
		incCount: number;

		/**
		 * 増加したドライブ使用量
		 */
		incSize: number;

		/**
		 * 減少したドライブファイル数
		 */
		decCount: number;

		/**
		 * 減少したドライブ使用量
		 */
		decSize: number;
	};

	remote: DriveLog['local'];
};

class DriveStats extends Stats<DriveLog> {
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

export const driveStats = new DriveStats();
//#endregion

//#region Network stats
/**
 * ネットワークに関する統計
 */
type NetworkLog = {
	/**
	 * 受信したリクエスト数
	 */
	incomingRequests: number;

	/**
	 * 送信したリクエスト数
	 */
	outgoingRequests: number;

	/**
	 * 応答時間の合計
	 * TIP: (totalTime / incomingRequests) でひとつのリクエストに平均でどれくらいの時間がかかったか知れる
	 */
	totalTime: number;

	/**
	 * 合計受信データ量
	 */
	incomingBytes: number;

	/**
	 * 合計送信データ量
	 */
	outgoingBytes: number;
};

class NetworkStats extends Stats<NetworkLog> {
	constructor() {
		super('network');
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: NetworkLog): Promise<NetworkLog> {
		return {
			incomingRequests: 0,
			outgoingRequests: 0,
			totalTime: 0,
			incomingBytes: 0,
			outgoingBytes: 0
		};
	}

	@autobind
	public async update(incomingRequests: number, time: number, incomingBytes: number, outgoingBytes: number) {
		const inc: Partial<NetworkLog> = {
			incomingRequests: incomingRequests,
			totalTime: time,
			incomingBytes: incomingBytes,
			outgoingBytes: outgoingBytes
		};

		await this.inc(inc);
	}
}

export const networkStats = new NetworkStats();
//#endregion

//#region Hashtag stats
/**
 * ハッシュタグに関する統計
 */
type HashtagLog = {
	/**
	 * 投稿された数
	 */
	count: number;
};

class HashtagStats extends Stats<HashtagLog> {
	constructor() {
		super('hashtag', true);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: HashtagLog): Promise<HashtagLog> {
		return {
			count: 0
		};
	}

	@autobind
	public async update(hashtag: string, userId: mongo.ObjectId) {
		const inc: Partial<HashtagLog> = {
			count: 1
		};

		await this.incIfUnique(inc, 'users', userId.toHexString(), hashtag);
	}
}

export const hashtagStats = new HashtagStats();
//#endregion

//#region Following stats
/**
 * ユーザーごとのフォローに関する統計
 */
type FollowingLog = {
	local: {
		/**
		 * フォローしている
		 */
		followings: {
			/**
			 * 合計
			 */
			total: number;

			/**
			 * フォローした数
			 */
			inc: number;

			/**
			 * フォロー解除した数
			 */
			dec: number;
		};

		/**
		 * フォローされている
		 */
		followers: {
			/**
			 * 合計
			 */
			total: number;

			/**
			 * フォローされた数
			 */
			inc: number;

			/**
			 * フォロー解除された数
			 */
			dec: number;
		};
	};

	remote: FollowingLog['local'];
};

class FollowingStats extends Stats<FollowingLog> {
	constructor() {
		super('following', true);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: FollowingLog, group?: any): Promise<FollowingLog> {
		const [
			localFollowingsCount,
			localFollowersCount,
			remoteFollowingsCount,
			remoteFollowersCount
		] = init ? await Promise.all([
			Following.count({ followerId: group, '_followee.host': null }),
			Following.count({ followeeId: group, '_follower.host': null }),
			Following.count({ followerId: group, '_followee.host': { $ne: null } }),
			Following.count({ followeeId: group, '_follower.host': { $ne: null } })
		]) : [
			latest ? latest.local.followings.total : 0,
			latest ? latest.local.followers.total : 0,
			latest ? latest.remote.followings.total : 0,
			latest ? latest.remote.followers.total : 0
		];

		return {
			local: {
				followings: {
					total: localFollowingsCount,
					inc: 0,
					dec: 0
				},
				followers: {
					total: localFollowersCount,
					inc: 0,
					dec: 0
				}
			},
			remote: {
				followings: {
					total: remoteFollowingsCount,
					inc: 0,
					dec: 0
				},
				followers: {
					total: remoteFollowersCount,
					inc: 0,
					dec: 0
				}
			}
		};
	}

	@autobind
	public async update(follower: IUser, followee: IUser, isFollow: boolean) {
		const update: Obj = {};

		update.total = isFollow ? 1 : -1;

		if (isFollow) {
			update.inc = 1;
		} else {
			update.dec = 1;
		}

		this.inc({
			[isLocalUser(follower) ? 'local' : 'remote']: { followings: update }
		}, follower._id);
		this.inc({
			[isLocalUser(followee) ? 'local' : 'remote']: { followers: update }
		}, followee._id);
	}
}

export const followingStats = new FollowingStats();
//#endregion

//#region Per user notes stats
/**
 * ユーザーごとの投稿に関する統計
 */
type PerUserNotesLog = {
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

	diffs: {
		/**
		 * 通常の投稿数の差分
		 */
		normal: number;

		/**
		 * リプライの投稿数の差分
		 */
		reply: number;

		/**
		 * Renoteの投稿数の差分
		 */
		renote: number;
	};
};

class PerUserNotesStats extends Stats<PerUserNotesLog> {
	constructor() {
		super('perUserNotes', true);
	}

	@autobind
	protected async getTemplate(init: boolean, latest?: PerUserNotesLog, group?: any): Promise<PerUserNotesLog> {
		const [count] = init ? await Promise.all([
			Note.count({ userId: group, deletedAt: null }),
		]) : [
			latest ? latest.total : 0
		];

		return {
			total: count,
			inc: 0,
			dec: 0,
			diffs: {
				normal: 0,
				reply: 0,
				renote: 0
			}
		};
	}

	@autobind
	public async update(user: IUser, note: INote, isAdditional: boolean) {
		const update: Obj = {
			diffs: {}
		};

		update.total = isAdditional ? 1 : -1;

		if (isAdditional) {
			update.inc = 1;
		} else {
			update.dec = 1;
		}

		if (note.replyId != null) {
			update.diffs.reply = isAdditional ? 1 : -1;
		} else if (note.renoteId != null) {
			update.diffs.renote = isAdditional ? 1 : -1;
		} else {
			update.diffs.normal = isAdditional ? 1 : -1;
		}

		await this.inc(update, user._id);
	}
}

export const perUserNotesStats = new PerUserNotesStats();
//#endregion
