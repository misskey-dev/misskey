'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import User from '../../../models/user';
import Following from '../../../models/following';

/**
 * Aggregate following of a user
 *
 * @param {Object} params
 * @return {Promise<object>}
 */
module.exports = (params) =>
	new Promise(async (res, rej) =>
{
	// Get 'user_id' parameter
	const userId = params.user_id;
	if (userId === undefined || userId === null) {
		return rej('user_id is required');
	}

	// Lookup user
	const user = await User.findOne({
		_id: new mongo.ObjectID(userId)
	});

	if (user === null) {
		return rej('user not found');
	}

	const startTime = new Date(new Date().setMonth(new Date().getMonth() - 1));

	const following = await Following
		.find({
			follower_id: user._id,
			$or: [
				{ deleted_at: { $exists: false } },
				{ deleted_at: { $gt: startTime } }
			]
		}, {
			_id: false,
			follower_id: false,
			followee_id: false
		}, {
			sort: { created_at: -1 }
		});

	const graph = [];

	for (let i = 0; i < 30; i++) {
		let day = new Date(new Date().setDate(new Date().getDate() - i));
		day = new Date(day.setMilliseconds(999));
		day = new Date(day.setSeconds(59));
		day = new Date(day.setMinutes(59));
		day = new Date(day.setHours(23));

		const count = following.filter(f =>
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
