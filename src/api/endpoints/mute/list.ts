/**
 * Module dependencies
 */
import $ from 'cafy';
import Mute from '../../models/mute';
import { pack } from '../../models/user';
import getFriends from '../../common/get-friends';

/**
 * Get muted users of a user
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'iknow' parameter
	const [iknow = false, iknowErr] = $(params.iknow).optional.boolean().$;
	if (iknowErr) return rej('invalid iknow param');

	// Get 'limit' parameter
	const [limit = 30, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'cursor' parameter
	const [cursor = null, cursorErr] = $(params.cursor).optional.id().$;
	if (cursorErr) return rej('invalid cursor param');

	// Construct query
	const query = {
		muter_id: me._id,
		deleted_at: { $exists: false }
	} as any;

	if (iknow) {
		// Get my friends
		const myFriends = await getFriends(me._id);

		query.mutee_id = {
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
		await pack(m.mutee_id, me, { detail: true })));

	// Response
	res({
		users: users,
		next: inStock ? mutes[mutes.length - 1]._id : null,
	});
});
