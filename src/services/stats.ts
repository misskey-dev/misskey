import * as mongo from 'mongodb';
import db from '../db/mongodb';
import { INote } from '../models/note';
import { isLocalUser, IUser } from '../models/user';
import { IDriveFile } from '../models/drive-file';
import { ICollection } from 'monk';

type Obj = { [key: string]: any };

type Partial<T> = {
	[P in keyof T]?: Partial<T[P]>;
};

type Span = 'day' | 'hour';

type ChartDocument<T extends Obj> = {
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
};

abstract class Chart<T> {
	protected collection: ICollection<ChartDocument<T>>;
	protected abstract generateInitialStats(): T;
	protected abstract generateEmptyStats(mostRecentStats: T): T;

	constructor(dbCollectionName: string) {
		this.collection = db.get<ChartDocument<T>>(dbCollectionName);
		this.collection.createIndex({ span: -1, date: -1 }, { unique: true });
		this.collection.createIndex('group');
	}

	protected async getCurrentStats(span: Span, group?: Obj): Promise<ChartDocument<T>> {
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
		const currentStats = await this.collection.findOne({
			group: group,
			span: span,
			date: current
		});

		if (currentStats) {
			return currentStats;
		} else {
			// 集計期間が変わってから、初めてのチャート更新なら
			// 最も最近の統計を持ってくる
			// * 例えば集計期間が「日」である場合で考えると、
			// * 昨日何もチャートを更新するような出来事がなかった場合は、
			// * 統計がそもそも作られずドキュメントが存在しないということがあり得るため、
			// * 「昨日の」と決め打ちせずに「もっとも最近の」とします
			const mostRecentStats = await this.collection.findOne({
				group: group,
				span: span
			}, {
				sort: {
					date: -1
				}
			});

			if (mostRecentStats) {
				// 現在の統計を初期挿入
				const data = this.generateEmptyStats(mostRecentStats.data);

				const stats = await this.collection.insert({
					group: group,
					span: span,
					date: current,
					data: data
				});

				return stats;
			} else {
				// 統計が存在しなかったら
				// * Misskeyインスタンスを建てて初めてのチャート更新時など

				// 空の統計を作成
				const data = this.generateInitialStats();

				const stats = await this.collection.insert({
					group: group,
					span: span,
					date: current,
					data: data
				});

				return stats;
			}
		}
	}

	protected inc(inc: Partial<T>, group?: Obj): void {
		const query: Obj = {};

		const dive = (path: string, x: Obj) => {
			Object.entries(x).forEach(([k, v]) => {
				if (typeof v === 'number') {
					query[path == null ? `data.${k}` : `data.${path}.${k}`] = v;
				} else {
					dive(path == null ? k : `${path}.${k}`, v);
				}
			});
		};

		dive(null, inc);

		this.getCurrentStats('day', group).then(stats => {
			this.collection.findOneAndUpdate({
				_id: stats._id
			}, {
				$inc: query
			});
		});

		this.getCurrentStats('hour', group).then(stats => {
			this.collection.findOneAndUpdate({
				_id: stats._id
			}, {
				$inc: query
			});
		});
	}

	public async getStats(span: Span, range: number, group?: Obj): Promise<T[]> {
		const chart: T[] = [];

		const now = new Date();
		const y = now.getFullYear();
		const m = now.getMonth();
		const d = now.getDate();
		const h = now.getHours();

		const gt =
			span == 'day' ? new Date(y, m, d - range) :
			span == 'hour' ? new Date(y, m, d, h - range) : null;

		const stats = await this.collection.find({
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

			const stat = stats.find(s => s.date.getTime() == current.getTime());

			if (stat) {
				chart.unshift(stat.data);
			} else { // 隙間埋め
				const mostRecent = stats.find(s => s.date.getTime() < current.getTime());
				if (mostRecent) {
					chart.unshift(this.generateEmptyStats(mostRecent.data));
				} else {
					chart.unshift(this.generateInitialStats());
				}
			}
		}

		return chart;
	}
}

//#region Users stats
/**
 * ユーザーに関する統計
 */
type UsersStats = {
	local: {
		/**
		 * 集計期間時点での、全ユーザー数 (ローカル)
		 */
		total: number;

		/**
		 * 増加したユーザー数 (ローカル)
		 */
		inc: number;

		/**
		 * 減少したユーザー数 (ローカル)
		 */
		dec: number;
	};

	remote: {
		/**
		 * 集計期間時点での、全ユーザー数 (リモート)
		 */
		total: number;

		/**
		 * 増加したユーザー数 (リモート)
		 */
		inc: number;

		/**
		 * 減少したユーザー数 (リモート)
		 */
		dec: number;
	};
};

class UsersChart extends Chart<UsersStats> {
	constructor() {
		super('usersStats');
	}

	protected generateInitialStats(): UsersStats {
		return {
			local: {
				total: 0,
				inc: 0,
				dec: 0
			},
			remote: {
				total: 0,
				inc: 0,
				dec: 0
			}
		};
	}

	protected generateEmptyStats(mostRecentStats: UsersStats): UsersStats {
		return {
			local: {
				total: mostRecentStats.local.total,
				inc: 0,
				dec: 0
			},
			remote: {
				total: mostRecentStats.remote.total,
				inc: 0,
				dec: 0
			}
		};
	}

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

export const usersChart = new UsersChart();
//#endregion

//#region Notes stats
/**
 * 投稿に関する統計
 */
type NotesStats = {
	local: {
		/**
		 * 集計期間時点での、全投稿数 (ローカル)
		 */
		total: number;

		/**
		 * 増加した投稿数 (ローカル)
		 */
		inc: number;

		/**
		 * 減少した投稿数 (ローカル)
		 */
		dec: number;

		diffs: {
			/**
			 * 通常の投稿数の差分 (ローカル)
			 */
			normal: number;

			/**
			 * リプライの投稿数の差分 (ローカル)
			 */
			reply: number;

			/**
			 * Renoteの投稿数の差分 (ローカル)
			 */
			renote: number;
		};
	};

	remote: {
		/**
		 * 集計期間時点での、全投稿数 (リモート)
		 */
		total: number;

		/**
		 * 増加した投稿数 (リモート)
		 */
		inc: number;

		/**
		 * 減少した投稿数 (リモート)
		 */
		dec: number;

		diffs: {
			/**
			 * 通常の投稿数の差分 (リモート)
			 */
			normal: number;

			/**
			 * リプライの投稿数の差分 (リモート)
			 */
			reply: number;

			/**
			 * Renoteの投稿数の差分 (リモート)
			 */
			renote: number;
		};
	};
};

class NotesChart extends Chart<NotesStats> {
	constructor() {
		super('notesStats');
	}

	protected generateInitialStats(): NotesStats {
		return {
			local: {
				total: 0,
				inc: 0,
				dec: 0,
				diffs: {
					normal: 0,
					reply: 0,
					renote: 0
				}
			},
			remote: {
				total: 0,
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

	protected generateEmptyStats(mostRecentStats: NotesStats): NotesStats {
		return {
			local: {
				total: mostRecentStats.local.total,
				inc: 0,
				dec: 0,
				diffs: {
					normal: 0,
					reply: 0,
					renote: 0
				}
			},
			remote: {
				total: mostRecentStats.remote.total,
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

	public async update(note: INote, isAdditional: boolean) {
		const update: Obj = {};

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

export const notesChart = new NotesChart();
//#endregion

//#region Drive stats
/**
 * ドライブに関する統計
 */
type DriveStats = {
	local: {
		/**
		 * 集計期間時点での、全ドライブファイル数 (ローカル)
		 */
		totalCount: number;

		/**
		 * 集計期間時点での、全ドライブファイルの合計サイズ (ローカル)
		 */
		totalSize: number;

		/**
		 * 増加したドライブファイル数 (ローカル)
		 */
		incCount: number;

		/**
		 * 増加したドライブ使用量 (ローカル)
		 */
		incSize: number;

		/**
		 * 減少したドライブファイル数 (ローカル)
		 */
		decCount: number;

		/**
		 * 減少したドライブ使用量 (ローカル)
		 */
		decSize: number;
	};

	remote: {
		/**
		 * 集計期間時点での、全ドライブファイル数 (リモート)
		 */
		totalCount: number;

		/**
		 * 集計期間時点での、全ドライブファイルの合計サイズ (リモート)
		 */
		totalSize: number;

		/**
		 * 増加したドライブファイル数 (リモート)
		 */
		incCount: number;

		/**
		 * 増加したドライブ使用量 (リモート)
		 */
		incSize: number;

		/**
		 * 減少したドライブファイル数 (リモート)
		 */
		decCount: number;

		/**
		 * 減少したドライブ使用量 (リモート)
		 */
		decSize: number;
	};
};

class DriveChart extends Chart<DriveStats> {
	constructor() {
		super('driveStats');
	}

	protected generateInitialStats(): DriveStats {
		return {
			local: {
				totalCount: 0,
				totalSize: 0,
				incCount: 0,
				incSize: 0,
				decCount: 0,
				decSize: 0
			},
			remote: {
				totalCount: 0,
				totalSize: 0,
				incCount: 0,
				incSize: 0,
				decCount: 0,
				decSize: 0
			}
		};
	}

	protected generateEmptyStats(mostRecentStats: DriveStats): DriveStats {
		return {
			local: {
				totalCount: mostRecentStats.local.totalCount,
				totalSize: mostRecentStats.local.totalSize,
				incCount: 0,
				incSize: 0,
				decCount: 0,
				decSize: 0
			},
			remote: {
				totalCount: mostRecentStats.remote.totalCount,
				totalSize: mostRecentStats.remote.totalSize,
				incCount: 0,
				incSize: 0,
				decCount: 0,
				decSize: 0
			}
		};
	}

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

export const driveChart = new DriveChart();
//#endregion

//#region Network stats
/**
 * ネットワークに関する統計
 */
type NetworkStats = {
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

class NetworkChart extends Chart<NetworkStats> {
	constructor() {
		super('networkStats');
	}

	protected generateInitialStats(): NetworkStats {
		return {
			incomingRequests: 0,
			outgoingRequests: 0,
			totalTime: 0,
			incomingBytes: 0,
			outgoingBytes: 0
		};
	}

	protected generateEmptyStats(mostRecentStats: NetworkStats): NetworkStats {
		return {
			incomingRequests: 0,
			outgoingRequests: 0,
			totalTime: 0,
			incomingBytes: 0,
			outgoingBytes: 0
		};
	}

	public async update(incomingRequests: number, time: number, incomingBytes: number, outgoingBytes: number) {
		const inc: Partial<NetworkStats> = {
			incomingRequests: incomingRequests,
			totalTime: time,
			incomingBytes: incomingBytes,
			outgoingBytes: outgoingBytes
		};

		await this.inc(inc);
	}
}

export const networkChart = new NetworkChart();
//#endregion
