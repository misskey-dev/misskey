import { INote } from '../models/note';
import Stats, { IStats } from '../models/stats';
import { isLocalUser, IUser } from '../models/user';
import { IDriveFile } from '../models/drive-file';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

async function getTodayStats(): Promise<IStats> {
	const now = new Date();
	const y = now.getFullYear();
	const m = now.getMonth();
	const d = now.getDate();
	const today = new Date(y, m, d);

	// 今日の統計
	const todayStats = await Stats.findOne({
		date: today
	});

	// 日付が変わってから、初めてのチャート更新なら
	if (todayStats == null) {
		// 最も最近の統計を持ってくる
		// * 昨日何もチャートを更新するような出来事がなかった場合は、
		//   統計がそもそも作られずドキュメントが存在しないということがあり得るため、
		//   「昨日の」と決め打ちせずに「もっとも最近の」とします
		const mostRecentStats = await Stats.findOne({}, {
			sort: {
				date: -1
			}
		});

		// 統計が存在しなかったら
		// * Misskeyインスタンスを建てて初めてのチャート更新時など
		if (mostRecentStats == null) {
			// 空の統計を作成
			const data: Omit<IStats, '_id'> = {
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
				},
				drive: {
					local: {
						totalCount: 0,
						totalSize: 0,
						diffCount: 0,
						diffSize: 0
					},
					remote: {
						totalCount: 0,
						totalSize: 0,
						diffCount: 0,
						diffSize: 0
					}
				}
			};

			const stats = await Stats.insert(data);

			return stats;
		} else {
			// 今日の統計を初期挿入
			const data: Omit<IStats, '_id'> = {
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
				},
				drive: {
					local: {
						totalCount: mostRecentStats.drive.local.totalCount,
						totalSize: mostRecentStats.drive.local.totalSize,
						diffCount: 0,
						diffSize: 0
					},
					remote: {
						totalCount: mostRecentStats.drive.remote.totalCount,
						totalSize: mostRecentStats.drive.remote.totalSize,
						diffCount: 0,
						diffSize: 0
					}
				}
			};

			const stats = await Stats.insert(data);

			return stats;
		}
	} else {
		return todayStats;
	}
}

async function update(inc: any) {
	const stats = await getTodayStats();

	await Stats.findOneAndUpdate({
		_id: stats._id
	}, {
		$inc: inc
	});
}

export async function updateUserStats(user: IUser, isAdditional: boolean) {
	const amount = isAdditional ? 1 : -1;
	const origin = isLocalUser(user) ? 'local' : 'remote';

	const inc = {} as any;
	inc[`users.${origin}.total`] = amount;
	inc[`users.${origin}.diff`] = amount;

	await update(inc);
}

export async function updateNoteStats(note: INote, isAdditional: boolean) {
	const amount = isAdditional ? 1 : -1;
	const origin = isLocalUser(note._user) ? 'local' : 'remote';

	const inc = {} as any;

	inc[`notes.${origin}.total`] = amount;
	inc[`notes.${origin}.diff`] = amount;

	if (note.replyId != null) {
		inc[`notes.${origin}.diffs.reply`] = amount;
	} else if (note.renoteId != null) {
		inc[`notes.${origin}.diffs.renote`] = amount;
	} else {
		inc[`notes.${origin}.diffs.normal`] = amount;
	}

	await update(inc);
}

export async function updateDriveStats(file: IDriveFile, isAdditional: boolean) {
	const amount = isAdditional ? 1 : -1;
	const size = isAdditional ? file.length : -file.length;
	const origin = isLocalUser(file.metadata._user) ? 'local' : 'remote';

	const inc = {} as any;
	inc[`drive.${origin}.totalCount`] = amount;
	inc[`drive.${origin}.diffCount`] = amount;
	inc[`drive.${origin}.totalSize`] = size;
	inc[`drive.${origin}.diffSize`] = size;

	await update(inc);
}
