'use strict';

/**
 * Module dependencies
 */
import User from '../../models/user';
import serialize from '../../serializers/user';
import getFriends from '../../common/get-friends';

/**
 * Get recommended users
 *
 * @param {Object} params
 * @param {Object} me
 * @return {Promise<object>}
 */
module.exports = (params, me) =>
	new Promise(async (res, rej) =>
{
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

	// Get 'offset' parameter
	let offset = params.offset;
	if (offset !== undefined && offset !== null) {
		offset = parseInt(offset, 10);
	} else {
		offset = 0;
	}

	// ID list of the user itself and other users who the user follows
	const followingIds = await getFriends(me._id);

	const users = await User
		.find({
			_id: {
				$nin: followingIds
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
		await serialize(user, me, { detail: true }))));
});
