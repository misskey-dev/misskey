import { INote } from '../models/note';
import Stats, { IStats } from '../models/stats';
import { isLocalUser, IUser } from '../models/user';
import { IDriveFile } from '../models/drive-file';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

async function getCurrentStats(span: 'day' | 'hour'): Promise<IStats> {
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
	const currentStats = await Stats.findOne({
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
		const mostRecentStats = await Stats.findOne({
			span: span
		}, {
			sort: {
				date: -1
			}
		});

		if (mostRecentStats) {
			// 現在の統計を初期挿入
			const data: Omit<IStats, '_id'> = {
				span: span,
				date: current,
				users: {
					local: {
						total: mostRecentStats.users.local.total,
						inc: 0,
						dec: 0
					},
					remote: {
						total: mostRecentStats.users.remote.total,
						inc: 0,
						dec: 0
					}
				},
				notes: {
					local: {
						total: mostRecentStats.notes.local.total,
						inc: 0,
						dec: 0,
						diffs: {
							normal: 0,
							reply: 0,
							renote: 0
						}
					},
					remote: {
						total: mostRecentStats.notes.remote.total,
						inc: 0,
						dec: 0,
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
						incCount: 0,
						incSize: 0,
						decCount: 0,
						decSize: 0
					},
					remote: {
						totalCount: mostRecentStats.drive.remote.totalCount,
						totalSize: mostRecentStats.drive.remote.totalSize,
						incCount: 0,
						incSize: 0,
						decCount: 0,
						decSize: 0
					}
				},
				network: {
					requests: 0,
					totalTime: 0,
					incomingBytes: 0,
					outgoingBytes: 0
				}
			};

			const stats = await Stats.insert(data);

			return stats;
		} else {
			// 統計が存在しなかったら
			// * Misskeyインスタンスを建てて初めてのチャート更新時など

			// 空の統計を作成
			const emptyStat: Omit<IStats, '_id'> = {
				span: span,
				date: current,
				users: {
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
				},
				notes: {
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
				},
				drive: {
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
				},
				network: {
					requests: 0,
					totalTime: 0,
					incomingBytes: 0,
					outgoingBytes: 0
				}
			};

			const stats = await Stats.insert(emptyStat);

			return stats;
		}
	}
}

function update(inc: any) {
	getCurrentStats('day').then(stats => {
		Stats.findOneAndUpdate({
			_id: stats._id
		}, {
			$inc: inc
		});
	});

	getCurrentStats('hour').then(stats => {
		Stats.findOneAndUpdate({
			_id: stats._id
		}, {
			$inc: inc
		});
	});
}

export async function updateUserStats(user: IUser, isAdditional: boolean) {
	const origin = isLocalUser(user) ? 'local' : 'remote';

	const inc = {} as any;
	inc[`users.${origin}.total`] = isAdditional ? 1 : -1;
	if (isAdditional) {
		inc[`users.${origin}.inc`] = 1;
	} else {
		inc[`users.${origin}.dec`] = 1;
	}

	await update(inc);
}

export async function updateNoteStats(note: INote, isAdditional: boolean) {
	const origin = isLocalUser(note._user) ? 'local' : 'remote';

	const inc = {} as any;

	inc[`notes.${origin}.total`] = isAdditional ? 1 : -1;

	if (isAdditional) {
		inc[`notes.${origin}.inc`] = 1;
	} else {
		inc[`notes.${origin}.dec`] = 1;
	}

	if (note.replyId != null) {
		inc[`notes.${origin}.diffs.reply`] = isAdditional ? 1 : -1;
	} else if (note.renoteId != null) {
		inc[`notes.${origin}.diffs.renote`] = isAdditional ? 1 : -1;
	} else {
		inc[`notes.${origin}.diffs.normal`] = isAdditional ? 1 : -1;
	}

	await update(inc);
}

export async function updateDriveStats(file: IDriveFile, isAdditional: boolean) {
	const origin = isLocalUser(file.metadata._user) ? 'local' : 'remote';

	const inc = {} as any;
	inc[`drive.${origin}.totalCount`] = isAdditional ? 1 : -1;
	inc[`drive.${origin}.totalSize`] = isAdditional ? file.length : -file.length;
	if (isAdditional) {
		inc[`drive.${origin}.incCount`] = 1;
		inc[`drive.${origin}.incSize`] = file.length;
	} else {
		inc[`drive.${origin}.decCount`] = 1;
		inc[`drive.${origin}.decSize`] = file.length;
	}

	await update(inc);
}

export async function updateNetworkStats(requests: number, time: number, incomingBytes: number, outgoingBytes: number) {
	const inc = {} as any;
	inc['network.requests'] = requests;
	inc['network.totalTime'] = time;
	inc['network.incomingBytes'] = incomingBytes;
	inc['network.outgoingBytes'] = outgoingBytes;

	await update(inc);
}
