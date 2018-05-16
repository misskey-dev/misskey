/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import Note from '../../../../models/note';
import { getFriendIds } from '../../common/get-friends';
import { pack } from '../../../../models/note';

/**
 * Get mentions of myself
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'following' parameter
	const [following = false, followingError] =
		$.bool.optional().get(params.following);
	if (followingError) return rej('invalid following param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $.num.optional().range(1, 100).get(params.limit);
	if (limitErr) return rej('invalid limit param');

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $.type(ID).optional().get(params.sinceId);
	if (sinceIdErr) return rej('invalid sinceId param');

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $.type(ID).optional().get(params.untilId);
	if (untilIdErr) return rej('invalid untilId param');

	// Check if both of sinceId and untilId is specified
	if (sinceId && untilId) {
		return rej('cannot set sinceId and untilId');
	}

	// Construct query
	const query = {
		mentions: user._id
	} as any;

	const sort = {
		_id: -1
	};

	if (following) {
		const followingIds = await getFriendIds(user._id);

		query.userId = {
			$in: followingIds
		};
	}

	if (sinceId) {
		sort._id = 1;
		query._id = {
			$gt: sinceId
		};
	} else if (untilId) {
		query._id = {
			$lt: untilId
		};
	}

	// Issue query
	const mentions = await Note
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(mentions.map(async mention =>
		await pack(mention, user)
	)));
});
