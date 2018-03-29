/**
 * Module dependencies
 */
import $ from 'cafy';
import Post from '../../../models/post';
import Reaction from '../../../models/post-reaction';

/**
 * Aggregate reaction of a post
 *
 * @param {any} params
 * @return {Promise<any>}
 */
module.exports = (params) => new Promise(async (res, rej) => {
	// Get 'postId' parameter
	const [postId, postIdErr] = $(params.postId).id().$;
	if (postIdErr) return rej('invalid postId param');

	// Lookup post
	const post = await Post.findOne({
		_id: postId
	});

	if (post === null) {
		return rej('post not found');
	}

	const datas = await Reaction
		.aggregate([
			{ $match: { postId: post._id } },
			{ $project: {
				createdAt: { $add: ['$createdAt', 9 * 60 * 60 * 1000] } // Convert into JST
			}},
			{ $project: {
				date: {
					year: { $year: '$createdAt' },
					month: { $month: '$createdAt' },
					day: { $dayOfMonth: '$createdAt' }
				}
			}},
			{ $group: {
				_id: '$date',
				count: { $sum: 1 }
			}}
		]);

	datas.forEach(data => {
		data.date = data._id;
		delete data._id;
	});

	const graph = [];

	for (let i = 0; i < 30; i++) {
		const day = new Date(new Date().setDate(new Date().getDate() - i));

		const data = datas.filter(d =>
			d.date.year == day.getFullYear() && d.date.month == day.getMonth() + 1 && d.date.day == day.getDate()
		)[0];

		if (data) {
			graph.push(data);
		} else {
			graph.push({
				date: {
					year: day.getFullYear(),
					month: day.getMonth() + 1, // In JavaScript, month is zero-based.
					day: day.getDate()
				},
				count: 0
			});
		}
	}

	res(graph);
});
