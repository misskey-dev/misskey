/**
 * Module dependencies
 */
import $ from 'cafy';
import getHostLower from '../../common/get-host-lower';
import Post, { pack } from '../../models/post';
import User from '../../models/user';

/**
 * Get posts of a user
 *
 * @param {any} params
 * @param {any} me
 * @return {Promise<any>}
 */
module.exports = (params, me) => new Promise(async (res, rej) => {
	// Get 'userId' parameter
	const [userId, userIdErr] = $(params.userId).optional.id().$;
	if (userIdErr) return rej('invalid userId param');

	// Get 'username' parameter
	const [username, usernameErr] = $(params.username).optional.string().$;
	if (usernameErr) return rej('invalid username param');

	if (userId === undefined && username === undefined) {
		return rej('userId or pair of username and host is required');
	}

	// Get 'host' parameter
	const [host, hostErr] = $(params.host).optional.string().$;
	if (hostErr) return rej('invalid host param');

	if (userId === undefined && host === undefined) {
		return rej('userId or pair of username and host is required');
	}

	// Get 'include_replies' parameter
	const [includeReplies = true, includeRepliesErr] = $(params.include_replies).optional.boolean().$;
	if (includeRepliesErr) return rej('invalid include_replies param');

	// Get 'with_media' parameter
	const [withMedia = false, withMediaErr] = $(params.with_media).optional.boolean().$;
	if (withMediaErr) return rej('invalid with_media param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'since_id' parameter
	const [sinceId, sinceIdErr] = $(params.since_id).optional.id().$;
	if (sinceIdErr) return rej('invalid since_id param');

	// Get 'until_id' parameter
	const [untilId, untilIdErr] = $(params.until_id).optional.id().$;
	if (untilIdErr) return rej('invalid until_id param');

	// Get 'since_date' parameter
	const [sinceDate, sinceDateErr] = $(params.since_date).optional.number().$;
	if (sinceDateErr) throw 'invalid since_date param';

	// Get 'until_date' parameter
	const [untilDate, untilDateErr] = $(params.until_date).optional.number().$;
	if (untilDateErr) throw 'invalid until_date param';

	// Check if only one of since_id, until_id, since_date, until_date specified
	if ([sinceId, untilId, sinceDate, untilDate].filter(x => x != null).length > 1) {
		throw 'only one of since_id, until_id, since_date, until_date can be specified';
	}

	const q = userId !== undefined
		? { _id: userId }
		: { usernameLower: username.toLowerCase(), hostLower: getHostLower(host) } ;

	// Lookup user
	const user = await User.findOne(q, {
		fields: {
			_id: true
		}
	});

	if (user === null) {
		return rej('user not found');
	}

	//#region Construct query
	const sort = {
		_id: -1
	};

	const query = {
		userId: user._id
	} as any;

	if (sinceId) {
		sort._id = 1;
		query._id = {
			$gt: sinceId
		};
	} else if (untilId) {
		query._id = {
			$lt: untilId
		};
	} else if (sinceDate) {
		sort._id = 1;
		query.createdAt = {
			$gt: new Date(sinceDate)
		};
	} else if (untilDate) {
		query.createdAt = {
			$lt: new Date(untilDate)
		};
	}

	if (!includeReplies) {
		query.replyId = null;
	}

	if (withMedia) {
		query.mediaIds = {
			$exists: true,
			$ne: null
		};
	}
	//#endregion

	// Issue query
	const posts = await Post
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(posts.map(async (post) =>
		await pack(post, me)
	)));
});
