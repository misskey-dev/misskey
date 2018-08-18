import { INote } from '../models/note';
import Chart, { IChart } from '../models/chart';
import { isLocalUser, IUser } from '../models/user';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

async function getTodayStats(): Promise<IChart> {
	const now = new Date();
	const y = now.getFullYear();
	const m = now.getMonth();
	const d = now.getDate();
	const today = new Date(y, m, d);

	// 今日の統計
	const todayStats = await Chart.findOne({
		date: today
	});

	// 日付が変わってから、初めてのチャート更新なら
	if (todayStats == null) {
		// 最も最近の統計を持ってくる
		// * 昨日何もチャートを更新するような出来事がなかった場合は、
		//   統計がそもそも作られずドキュメントが存在しないということがあり得るため、
		//   「昨日の」と決め打ちせずに「もっとも最近の」とします
		const mostRecentStats = await Chart.findOne({}, {
			sort: {
				date: -1
			}
		});

		// 統計が存在しなかったら
		// * Misskeyインスタンスを建てて初めてのチャート更新時など
		if (mostRecentStats == null) {
			// 空の統計を作成
			const chart: Omit<IChart, '_id'> = {
				date: today,
				users: {
					local: {
						total: 0,
						diff: 0
					},
					remote: {
						total: 0,
						diff: 0
					}
				},
				notes: {
					local: {
						total: 0,
						diff: 0,
						diffs: {
							normal: 0,
							reply: 0,
							renote: 0
						}
					},
					remote: {
						total: 0,
						diff: 0,
						diffs: {
							normal: 0,
							reply: 0,
							renote: 0
						}
					}
				}
			};

			const stats = await Chart.insert(chart);

			return stats;
		} else {
			// 今日の統計を初期挿入
			const chart: Omit<IChart, '_id'> = {
				date: today,
				users: {
					local: {
						total: mostRecentStats.users.local.total,
						diff: 0
					},
					remote: {
						total: mostRecentStats.users.remote.total,
						diff: 0
					}
				},
				notes: {
					local: {
						total: mostRecentStats.notes.local.total,
						diff: 0,
						diffs: {
							normal: 0,
							reply: 0,
							renote: 0
						}
					},
					remote: {
						total: mostRecentStats.notes.remote.total,
						diff: 0,
						diffs: {
							normal: 0,
							reply: 0,
							renote: 0
						}
					}
				}
			};

			const stats = await Chart.insert(chart);

			return stats;
		}
	} else {
		return todayStats;
	}
}

async function update(inc: any) {
	const stats = await getTodayStats();

	await Chart.findOneAndUpdate({
		_id: stats._id
	}, {
		$inc: inc
	});
}

export async function updateUserStats(user: IUser, isAdditional: boolean) {
	const inc = {} as any;

	const val = isAdditional ? 1 : -1;

	if (isLocalUser(user)) {
		inc['users.local.total'] = val;
		inc['users.local.diff'] = val;
	} else {
		inc['users.remote.total'] = val;
		inc['users.remote.diff'] = val;
	}

	await update(inc);
}

export async function updateNoteStats(note: INote, isAdditional: boolean) {
	const inc = {} as any;

	const val = isAdditional ? 1 : -1;

	if (isLocalUser(note._user)) {
		inc['notes.local.total'] = val;
		inc['notes.local.diff'] = val;

		if (note.replyId != null) {
			inc['notes.local.diffs.reply'] = val;
		} else if (note.renoteId != null) {
			inc['notes.local.diffs.renote'] = val;
		} else {
			inc['notes.local.diffs.normal'] = val;
		}
	} else {
		inc['notes.remote.total'] = val;
		inc['notes.remote.diff'] = val;

		if (note.replyId != null) {
			inc['notes.remote.diffs.reply'] = val;
		} else if (note.renoteId != null) {
			inc['notes.remote.diffs.renote'] = val;
		} else {
			inc['notes.remote.diffs.normal'] = val;
		}
	}

	await update(inc);
}
