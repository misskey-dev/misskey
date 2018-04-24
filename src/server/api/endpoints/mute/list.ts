/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import Mute from '../../../../models/mute';
import { pack } from '../../../../models/user';
import { getFriendIds } from '../../common/get-friends';

/**
 * Get muted users of a user
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'iknow' parameter
	const [iknow = false, iknowErr] = $(params.iknow).optional.boolean().$;
	if (iknowErr) return rej('invalid iknow param');

	// Get 'limit' parameter
	const [limit = 30, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'cursor' parameter
	const [cursor = null, cursorErr] = $(params.cursor).optional.type(ID).$;
	if (cursorErr) return rej('invalid cursor param');

	// Construct query
	const query = {
		muterId: me._id,
		deletedAt: { $exists: false }
	} as any;

	if (iknow) {
		// Get my friends
		const myFriends = await getFriendIds(me._id);

		query.muteeId = {
			$in: myFriends
		};
	}

	// カーソルが指定されている場合
	if (cursor) {
		query._id = {
			$lt: cursor
		};
	}

	// Get mutes
	const mutes = await Mute
		.find(query, {
			limit: limit + 1,
			sort: { _id: -1 }
		});

	// 「次のページ」があるかどうか
	const inStock = mutes.length === limit + 1;
	if (inStock) {
		mutes.pop();
	}

	// Serialize
	const users = await Promise.all(mutes.map(async m =>
		await pack(m.muteeId, me, { detail: true })));

	// Response
	res({
		users: users,
		next: inStock ? mutes[mutes.length - 1]._id : null,
	});
});
