import Stats, { IStats } from '../../../../models/stats';

type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

export const meta = {
	requireCredential: true,
	requireAdmin: true
};

export default (params: any) => new Promise(async (res, rej) => {
	const now = new Date();
	const y = now.getFullYear();
	const m = now.getMonth();
	const d = now.getDate();

	const stats = await Stats.find({
		date: {
			$gt: new Date(y - 1, m, d)
		}
	}, {
		sort: {
			date: -1
		},
		fields: {
			_id: 0
		}
	});

	const chart: Array<Omit<IStats, '_id'>> = [];

	for (let i = 364; i >= 0; i--) {
		const day = new Date(y, m, d - i);

		const stat = stats.find(s => s.date.getTime() == day.getTime());

		if (stat) {
			chart.unshift(stat);
		} else { // 隙間埋め
			const mostRecent = stats.find(s => s.date.getTime() < day.getTime());
			if (mostRecent) {
				chart.unshift(Object.assign({}, mostRecent, {
					date: day
				}));
			} else {
				chart.unshift({
					date: day,
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
		delete x.date;
	});

	res(chart);
});
