/**
 * Module dependencies
 */
import $ from 'cafy';
import Post from '../../../models/post';
import Reaction from '../../../models/post-reaction';

/**
 * Aggregate reactions of a post
 *
 * @param {any} params
 * @return {Promise<any>}
 */
module.exports = (params) => new Promise(async (res, rej) => {
	// Get 'post_id' parameter
	const [postId, postIdErr] = $(params.post_id).id().$;
	if (postIdErr) return rej('invalid post_id param');

	// Lookup post
	const post = await Post.findOne({
		_id: postId
	});

	if (post === null) {
		return rej('post not found');
	}

	const startTime = new Date(new Date().setMonth(new Date().getMonth() - 1));

	const reactions = await Reaction
		.find({
			post_id: post._id,
			$or: [
				{ deleted_at: { $exists: false } },
				{ deleted_at: { $gt: startTime } }
			]
		}, {
			sort: {
				_id: -1
			},
			fields: {
				_id: false,
				post_id: false
			}
		});

	const graph = [];

	for (let i = 0; i < 30; i++) {
		let day = new Date(new Date().setDate(new Date().getDate() - i));
		day = new Date(day.setMilliseconds(999));
		day = new Date(day.setSeconds(59));
		day = new Date(day.setMinutes(59));
		day = new Date(day.setHours(23));
		// day = day.getTime();

		const count = reactions.filter(r =>
			r.created_at < day && (r.deleted_at == null || r.deleted_at > day)
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
