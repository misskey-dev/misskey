/**
 * Module dependencies
 */
import $ from 'cafy';
import User from '../../models/user';
import Following from '../../models/following';
import { pack } from '../../models/user';
import getFriends from '../../common/get-friends';

/**
 * Get followers of a user
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'userId' parameter
	const [userId, userIdErr] = $(params.userId).id().$;
	if (userIdErr) return rej('invalid userId param');

	// Get 'iknow' parameter
	const [iknow = false, iknowErr] = $(params.iknow).optional.boolean().$;
	if (iknowErr) return rej('invalid iknow param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'cursor' parameter
	const [cursor = null, cursorErr] = $(params.cursor).optional.id().$;
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
		followeeId: user._id,
		deletedAt: { $exists: false }
	} as any;

	// ログインしていてかつ iknow フラグがあるとき
	if (me && iknow) {
		// Get my friends
		const myFriends = await getFriends(me._id);

		query.followerId = {
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
		await pack(f.followerId, me, { detail: true })));

	// Response
	res({
		users: users,
		next: inStock ? following[following.length - 1]._id : null,
	});
});
