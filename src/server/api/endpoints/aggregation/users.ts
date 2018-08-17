import $ from 'cafy';
import User from '../../../../models/user';

export const meta = {
	requireCredential: true,
	requireAdmin: true
};

/**
 * Aggregate users
 */
export default (params: any) => new Promise(async (res, rej) => {
	const query = [{
		createdAt: {
			$gt: new Date(new Date().setFullYear(new Date().getFullYear() - 1))
		}
	}, {
		$project: {
			host: '$host',
			createdAt: { $add: ['$createdAt', 9 * 60 * 60 * 1000] } // Convert into JST
		}
	}, {
		$project: {
			date: {
				year: { $year: '$createdAt' },
				month: { $month: '$createdAt' },
				day: { $dayOfMonth: '$createdAt' }
			},
			origin: {
				$cond: {
					if: { $eq: ['$host', null] },
					then: 'local',
					else: 'remote'
				}
			}
		}
	}, {
		$group: {
			_id: {
				date: '$date',
				origin: '$origin'
			},
			count: { $sum: 1 }
		}
	}, {
		$group: {
			_id: '$_id.date',
			data: {
				$addToSet: {
					type: '$_id.type',
					origin: '$_id.origin',
					count: '$count'
				}
			}
		}
	}] as any;

	const datas = await User.aggregate(query);

	datas.forEach((data: any) => {
		data.date = data._id;
		delete data._id;

		data.local = (data.data.filter((x: any) => x.origin == 'local')[0] || { count: 0 }).count;
		data.remote = (data.data.filter((x: any) => x.origin == 'remote')[0] || { count: 0 }).count;

		delete data.data;
	});

	const graph = [];

	for (let i = 0; i < 365; i++) {
		const day = new Date(new Date().setDate(new Date().getDate() - i));

		const data = datas.filter((d: any) =>
			d.date.year == day.getFullYear() && d.date.month == day.getMonth() + 1 && d.date.day == day.getDate()
		)[0];

		if (data) {
			graph.push(data);
		} else {
			graph.push({
				date: { year: day.getFullYear(), month: day.getMonth() + 1, day: day.getDate() },
				local: 0,
				remote: 0
			});
		}
	}

	res(graph);
});
