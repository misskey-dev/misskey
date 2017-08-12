/**
 * Module dependencies
 */
import $ from 'cafy';
import User from '../../models/user';

/**
 * Aggregate users
 *
 * @param {any} params
 * @return {Promise<any>}
 */
module.exports = params => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 365, limitErr] = $(params.limit).optional.number().range(1, 365).$;
	if (limitErr) return rej('invalid limit param');

	const startTime = new Date(new Date().setMonth(new Date().getMonth() - 1));

	const users = await User
		.find({
			$or: [
				{ deleted_at: { $exists: false } },
				{ deleted_at: { $gt: startTime } }
			]
		}, {
			_id: false,
			created_at: true,
			deleted_at: true
		}, {
			sort: { created_at: -1 }
		});

	const graph = [];

	for (let i = 0; i < limit; i++) {
		let day = new Date(new Date().setDate(new Date().getDate() - i));
		day = new Date(day.setMilliseconds(999));
		day = new Date(day.setSeconds(59));
		day = new Date(day.setMinutes(59));
		day = new Date(day.setHours(23));
		// day = day.getTime();

		const count = users.filter(f =>
			f.created_at < day && (f.deleted_at == null || f.deleted_at > day)
		).length;

		graph.push({
			date: {
				year: day.getFullYear(),
				month: day.getMonth() + 1, // In JavaScript, month is zero-based.
				day: day.getDate()
			},
			count: count
		});
	}

	res(graph);
});
