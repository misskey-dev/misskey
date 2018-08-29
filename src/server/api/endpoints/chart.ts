import $ from 'cafy';
import Stats, { IStats } from '../../../models/stats';
import getParams from '../get-params';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

function migrateStats(stats: IStats[]) {
	stats.forEach(stat => {
		const isOldData =
			stat.users.local.inc == null ||
			stat.users.local.dec == null ||
			stat.users.remote.inc == null ||
			stat.users.remote.dec == null ||
			stat.notes.local.inc == null ||
			stat.notes.local.dec == null ||
			stat.notes.remote.inc == null ||
			stat.notes.remote.dec == null ||
			stat.drive.local.incCount == null ||
			stat.drive.local.decCount == null ||
			stat.drive.local.incSize == null ||
			stat.drive.local.decSize == null ||
			stat.drive.remote.incCount == null ||
			stat.drive.remote.decCount == null ||
			stat.drive.remote.incSize == null ||
			stat.drive.remote.decSize == null;

		if (!isOldData) return;

		stat.users.local.inc = (stat as any).users.local.diff;
		stat.users.local.dec = 0;
		stat.users.remote.inc = (stat as any).users.remote.diff;
		stat.users.remote.dec = 0;
		stat.notes.local.inc = (stat as any).notes.local.diff;
		stat.notes.local.dec = 0;
		stat.notes.remote.inc = (stat as any).notes.remote.diff;
		stat.notes.remote.dec = 0;
		stat.drive.local.incCount = (stat as any).drive.local.diffCount;
		stat.drive.local.decCount = 0;
		stat.drive.local.incSize = (stat as any).drive.local.diffSize;
		stat.drive.local.decSize = 0;
		stat.drive.remote.incCount = (stat as any).drive.remote.diffCount;
		stat.drive.remote.decCount = 0;
		stat.drive.remote.incSize = (stat as any).drive.remote.diffSize;
		stat.drive.remote.decSize = 0;
	});
}

export const meta = {
	desc: {
		'ja-JP': 'インスタンスの統計を取得します。'
	},

	params: {
		limit: $.num.optional.range(1, 100).note({
			default: 30,
			desc: {
				'ja-JP': '最大数'
			}
		}),
	}
};

export default (params: any) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) throw psErr;

	const daysRange = ps.limit;
	const hoursRange = ps.limit;

	const now = new Date();
	const y = now.getFullYear();
	const m = now.getMonth();
	const d = now.getDate();
	const h = now.getHours();

	const [statsPerDay, statsPerHour] = await Promise.all([
		Stats.find({
			span: 'day',
			date: {
				$gt: new Date(y, m, d - daysRange)
			}
		}, {
			sort: {
				date: -1
			},
			fields: {
				_id: 0
			}
		}),
		Stats.find({
			span: 'hour',
			date: {
				$gt: new Date(y, m, d, h - hoursRange)
			}
		}, {
			sort: {
				date: -1
			},
			fields: {
				_id: 0
			}
		}),
	]);

	// 後方互換性のため
	migrateStats(statsPerDay);
	migrateStats(statsPerHour);

	const format = (src: IStats[], span: 'day' | 'hour') => {
		const chart: Array<Omit<Omit<IStats, '_id'>, 'span'>> = [];

		const range =
			span == 'day' ? daysRange :
			span == 'hour' ? hoursRange :
			null;

		for (let i = (range - 1); i >= 0; i--) {
			const current =
				span == 'day' ? new Date(y, m, d - i) :
				span == 'hour' ? new Date(y, m, d, h - i) :
				null;

			const stat = src.find(s => s.date.getTime() == current.getTime());

			if (stat) {
				chart.unshift(stat);
			} else { // 隙間埋め
				const mostRecent = src.find(s => s.date.getTime() < current.getTime());
				if (mostRecent) {
					chart.unshift({
						date: current,
						users: {
							local: {
								total: mostRecent.users.local.total,
								inc: 0,
								dec: 0
							},
							remote: {
								total: mostRecent.users.remote.total,
								inc: 0,
								dec: 0
							}
						},
						notes: {
							local: {
								total: mostRecent.notes.local.total,
								inc: 0,
								dec: 0,
								diffs: {
									normal: 0,
									reply: 0,
									renote: 0
								}
							},
							remote: {
								total: mostRecent.notes.remote.total,
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
								totalCount: mostRecent.drive.local.totalCount,
								totalSize: mostRecent.drive.local.totalSize,
								incCount: 0,
								incSize: 0,
								decCount: 0,
								decSize: 0
							},
							remote: {
								totalCount: mostRecent.drive.remote.totalCount,
								totalSize: mostRecent.drive.remote.totalSize,
								incCount: 0,
								incSize: 0,
								decCount: 0,
								decSize: 0
							}
						}
					});
				} else {
					chart.unshift({
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
						}
					});
				}
			}
		}

		chart.forEach(x => {
			delete (x as any).span;
		});

		return chart;
	};

	res({
		perDay: format(statsPerDay, 'day'),
		perHour: format(statsPerHour, 'hour')
	});
});
