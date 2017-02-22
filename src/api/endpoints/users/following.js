'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import User from '../../models/user';
import Following from '../../models/following';
import serialize from '../../serializers/user';
import getFriends from '../../common/get-friends';

/**
 * Get following users of a user
 *
 * @param {Object} params
 * @param {Object} me
 * @return {Promise<object>}
 */
module.exports = (params, me) =>
	new Promise(async (res, rej) =>
{
	// Get 'user_id' parameter
	const userId = params.user_id;
	if (userId === undefined || userId === null) {
		return rej('user_id is required');
	}

	// Get 'iknow' parameter
	const iknow = params.iknow;

	// Get 'limit' parameter
	let limit = params.limit;
	if (limit !== undefined && limit !== null) {
		limit = parseInt(limit, 10);

		// From 1 to 100
		if (!(1 <= limit && limit <= 100)) {
			return rej('invalid limit range');
		}
	} else {
		limit = 10;
	}

	// Get 'cursor' parameter
	const cursor = params.cursor || null;

	// Lookup user
	const user = await User.findOne({
		_id: new mongo.ObjectID(userId)
	}, {
		fields: {
			_id: true
		}
	});

	if (user === null) {
		return rej('user not found');
	}

	// Construct query
	const query = {
		follower_id: user._id,
		deleted_at: { $exists: false }
	};

	// ログインしていてかつ iknow フラグがあるとき
	if (me && iknow) {
		// Get my friends
		const myFriends = await getFriends(me._id);

		query.followee_id = {
			$in: myFriends
		};
	}

	// カーソルが指定されている場合
	if (cursor) {
		query._id = {
			$lt: new mongo.ObjectID(cursor)
		};
	}

	// Get followers
	const following = await Following
		.find(query, {
			limit: limit + 1,
			sort: { _id: -1 }
		});

	// 「次のページ」があるかどうか
	const inStock = following.length === limit + 1;
	if (inStock) {
		following.pop();
	}

	// Serialize
	const users = await Promise.all(following.map(async f =>
		await serialize(f.followee_id, me, { detail: true })));

	// Response
	res({
		users: users,
		next: inStock ? following[following.length - 1]._id : null,
	});
});
