/**
 * Module dependencies
 */
const ms = require('ms');
import $ from 'cafy';
import User, { pack } from '../../../../models/user';
import { getFriendIds } from '../../common/get-friends';
import Mute from '../../../../models/mute';

/**
 * Get recommended users
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).get();
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $(params.offset).optional.number().min(0).get();
	if (offsetErr) return rej('invalid offset param');

	// ID list of the user itself and other users who the user follows
	const followingIds = await getFriendIds(me._id);

	// ミュートしているユーザーを取得
	const mutedUserIds = (await Mute.find({
		muterId: me._id
	})).map(m => m.muteeId);

	const users = await User
		.find({
			_id: {
				$nin: followingIds.concat(mutedUserIds)
			},
			$or: [{
				lastUsedAt: {
					$gte: new Date(Date.now() - ms('7days'))
				}
			}, {
				host: null
			}]
		}, {
			limit: limit,
			skip: offset,
			sort: {
				followersCount: -1
			}
		});

	// Serialize
	res(await Promise.all(users.map(async user =>
		await pack(user, me, { detail: true }))));
});
