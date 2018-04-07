/**
 * Module dependencies
 */
import $ from 'cafy';
import Note from '../../../../models/note';

/**
 * Aggregate notes
 *
 * @param {any} params
 * @return {Promise<any>}
 */
module.exports = params => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 365, limitErr] = $(params.limit).optional.number().range(1, 365).$;
	if (limitErr) return rej('invalid limit param');

	const datas = await Note
		.aggregate([
			{ $project: {
				renoteId: '$renoteId',
				replyId: '$replyId',
				createdAt: { $add: ['$createdAt', 9 * 60 * 60 * 1000] } // Convert into JST
			}},
			{ $project: {
				date: {
					year: { $year: '$createdAt' },
					month: { $month: '$createdAt' },
					day: { $dayOfMonth: '$createdAt' }
				},
				type: {
					$cond: {
						if: { $ne: ['$renoteId', null] },
						then: 'renote',
						else: {
							$cond: {
								if: { $ne: ['$replyId', null] },
								then: 'reply',
								else: 'note'
							}
						}
					}
				}}
			},
			{ $group: { _id: {
				date: '$date',
				type: '$type'
			}, count: { $sum: 1 } } },
			{ $group: {
				_id: '$_id.date',
				data: { $addToSet: {
					type: '$_id.type',
					count: '$count'
				}}
			} }
		]);

	datas.forEach(data => {
		data.date = data._id;
		delete data._id;

		data.notes = (data.data.filter(x => x.type == 'note')[0] || { count: 0 }).count;
		data.renotes = (data.data.filter(x => x.type == 'renote')[0] || { count: 0 }).count;
		data.replies = (data.data.filter(x => x.type == 'reply')[0] || { count: 0 }).count;

		delete data.data;
	});

	const graph = [];

	for (let i = 0; i < limit; i++) {
		const day = new Date(new Date().setDate(new Date().getDate() - i));

		const data = datas.filter(d =>
			d.date.year == day.getFullYear() && d.date.month == day.getMonth() + 1 && d.date.day == day.getDate()
		)[0];

		if (data) {
			graph.push(data);
		} else {
			graph.push({
				notes: 0,
				renotes: 0,
				replies: 0
			});
		}
	}

	res(graph);
});
