import Stats, { IStats } from '../../../models/stats';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export const meta = {
};

export default (params: any) => new Promise(async (res, rej) => {
	const daysRange = 90;
	const hoursRange = 24;

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
					chart.unshift(Object.assign({}, mostRecent, {
						date: current
					}));
				} else {
					chart.unshift({
						date: current,
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
