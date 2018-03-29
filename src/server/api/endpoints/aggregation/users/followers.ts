/**
 * Module dependencies
 */
import $ from 'cafy';
import User from '../../../../../models/user';
import Following from '../../../../../models/following';

/**
 * Aggregate followers of a user
 *
 * @param {any} params
 * @return {Promise<any>}
 */
module.exports = (params) => new Promise(async (res, rej) => {
	// Get 'userId' parameter
	const [userId, userIdErr] = $(params.userId).id().$;
	if (userIdErr) return rej('invalid userId param');

	// Lookup user
	const user = await User.findOne({
		_id: userId
	}, {
		fields: {
			_id: true
		}
	});

	if (user === null) {
		return rej('user not found');
	}

	const startTime = new Date(new Date().setMonth(new Date().getMonth() - 1));

	const following = await Following
		.find({
			followeeId: user._id,
			$or: [
				{ deletedAt: { $exists: false } },
				{ deletedAt: { $gt: startTime } }
			]
		}, {
			sort: { createdAt: -1 },
			fields: {
				_id: false,
				followerId: false,
				followeeId: false
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

		const count = following.filter(f =>
			f.createdAt < day && (f.deletedAt == null || f.deletedAt > day)
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
