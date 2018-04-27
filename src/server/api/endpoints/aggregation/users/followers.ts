/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../../cafy-id';
import User from '../../../../../models/user';
import FollowedLog from '../../../../../models/followed-log';

/**
 * Aggregate followers of a user
 */
module.exports = (params) => new Promise(async (res, rej) => {
	// Get 'userId' parameter
	const [userId, userIdErr] = $(params.userId).type(ID).get();
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

	const today = new Date();
	const graph = [];

	today.setMinutes(0);
	today.setSeconds(0);
	today.setMilliseconds(0);

	let cursorDate = new Date(today.getTime());
	let cursorTime = cursorDate.setDate(new Date(today.getTime()).getDate() + 1);

	for (let i = 0; i < 30; i++) {
		graph.push(FollowedLog.findOne({
			createdAt: { $lt: new Date(cursorTime / 1000) },
			userId: user._id
		}, {
			sort: { createdAt: -1 },
		}).then(log => {
			cursorDate = new Date(today.getTime());
			cursorTime = cursorDate.setDate(today.getDate() - i);

			return {
				date: {
					year: cursorDate.getFullYear(),
					month: cursorDate.getMonth() + 1, // In JavaScript, month is zero-based.
					day: cursorDate.getDate()
				},
				count: log ? log.count : 0
			};
		}));
	}

	res(await Promise.all(graph));
});
