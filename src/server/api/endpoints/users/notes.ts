/**
 * Module dependencies
 */
import $ from 'cafy';
import getHostLower from '../../common/get-host-lower';
import Note, { pack } from '../../../../models/note';
import User from '../../../../models/user';

/**
 * Get notes of a user
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

	// Get 'includeReplies' parameter
	const [includeReplies = true, includeRepliesErr] = $(params.includeReplies).optional.boolean().$;
	if (includeRepliesErr) return rej('invalid includeReplies param');

	// Get 'withMedia' parameter
	const [withMedia = false, withMediaErr] = $(params.withMedia).optional.boolean().$;
	if (withMediaErr) return rej('invalid withMedia param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $(params.sinceId).optional.id().$;
	if (sinceIdErr) return rej('invalid sinceId param');

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $(params.untilId).optional.id().$;
	if (untilIdErr) return rej('invalid untilId param');

	// Get 'sinceDate' parameter
	const [sinceDate, sinceDateErr] = $(params.sinceDate).optional.number().$;
	if (sinceDateErr) throw 'invalid sinceDate param';

	// Get 'untilDate' parameter
	const [untilDate, untilDateErr] = $(params.untilDate).optional.number().$;
	if (untilDateErr) throw 'invalid untilDate param';

	// Check if only one of sinceId, untilId, sinceDate, untilDate specified
	if ([sinceId, untilId, sinceDate, untilDate].filter(x => x != null).length > 1) {
		throw 'only one of sinceId, untilId, sinceDate, untilDate can be specified';
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
			$ne: []
		};
	}
	//#endregion

	// Issue query
	const notes = await Note
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(notes.map(async (note) =>
		await pack(note, me)
	)));
});
