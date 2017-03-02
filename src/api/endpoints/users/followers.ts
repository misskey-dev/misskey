'use strict';

/**
 * Module dependencies
 */
import it from '../../it';
import User from '../../models/user';
import Following from '../../models/following';
import serialize from '../../serializers/user';
import getFriends from '../../common/get-friends';

/**
 * Get followers of a user
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) =>
	new Promise(async (res, rej) =>
{
	// Get 'user_id' parameter
	const [userId, userIdErr] = it(params.user_id, 'id', true);
	if (userIdErr) return rej('invalid user_id param');

	// Get 'iknow' parameter
	const [iknow, iknowErr] = it(params.iknow).expect.boolean().default(false).qed();
	if (iknowErr) return rej('invalid iknow param');

	// Get 'limit' parameter
	const [limit, limitErr] = it(params.limit).expect.number().range(1, 100).default(10).qed();
	if (limitErr) return rej('invalid limit param');

	// Get 'cursor' parameter
	const [cursor, cursorErr] = it(params.cursor).expect.id().default(null).qed();
	if (cursorErr) return rej('invalid cursor param');

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

	// Construct query
	const query = {
		followee_id: user._id,
		deleted_at: { $exists: false }
	} as any;

	// ログインしていてかつ iknow フラグがあるとき
	if (me && iknow) {
		// Get my friends
		const myFriends = await getFriends(me._id);

		query.follower_id = {
			$in: myFriends
		};
	}

	// カーソルが指定されている場合
	if (cursor) {
		query._id = {
			$lt: cursor
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
		await serialize(f.follower_id, me, { detail: true })));

	// Response
	res({
		users: users,
		next: inStock ? following[following.length - 1]._id : null,
	});
});
