/**
 * Module dependencies
 */
const ms = require('ms');
import $ from 'cafy';
import User, { pack } from '../../models/user';
import getFriends from '../../common/get-friends';

/**
 * Get recommended users
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $(params.offset).optional.number().min(0).$;
	if (offsetErr) return rej('invalid offset param');

	// ID list of the user itself and other users who the user follows
	const followingIds = await getFriends(me._id);

	const users = await User
		.find({
			_id: {
				$nin: followingIds
			},
			'account.last_used_at': {
				$gte: new Date(Date.now() - ms('7days'))
			}
		}, {
			limit: limit,
			skip: offset,
			sort: {
				followers_count: -1
			}
		});

	// Serialize
	res(await Promise.all(users.map(async user =>
		await pack(user, me, { detail: true }))));
});
