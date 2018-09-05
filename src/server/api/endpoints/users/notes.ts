import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import getHostLower from '../../common/get-host-lower';
import Note, { pack } from '../../../../models/note';
import User, { ILocalUser } from '../../../../models/user';

/**
 * Get notes of a user
 */
export default (params: any, me: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'userId' parameter
	const [userId, userIdErr] = $.type(ID).optional.get(params.userId);
	if (userIdErr) return rej('invalid userId param');

	// Get 'username' parameter
	const [username, usernameErr] = $.str.optional.get(params.username);
	if (usernameErr) return rej('invalid username param');

	if (userId === undefined && username === undefined) {
		return rej('userId or username is required');
	}

	// Get 'host' parameter
	const [host, hostErr] = $.str.optional.get(params.host);
	if (hostErr) return rej('invalid host param');

	// Get 'includeReplies' parameter
	const [includeReplies = true, includeRepliesErr] = $.bool.optional.get(params.includeReplies);
	if (includeRepliesErr) return rej('invalid includeReplies param');

	// Get 'withFiles' parameter
	const [withFiles = false, withFilesErr] = $.bool.optional.get(params.withFiles);
	if (withFilesErr) return rej('invalid withFiles param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $.num.optional.range(1, 100).get(params.limit);
	if (limitErr) return rej('invalid limit param');

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $.type(ID).optional.get(params.sinceId);
	if (sinceIdErr) return rej('invalid sinceId param');

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $.type(ID).optional.get(params.untilId);
	if (untilIdErr) return rej('invalid untilId param');

	// Get 'sinceDate' parameter
	const [sinceDate, sinceDateErr] = $.num.optional.get(params.sinceDate);
	if (sinceDateErr) throw 'invalid sinceDate param';

	// Get 'untilDate' parameter
	const [untilDate, untilDateErr] = $.num.optional.get(params.untilDate);
	if (untilDateErr) throw 'invalid untilDate param';

	// Check if only one of sinceId, untilId, sinceDate, untilDate specified
	if ([sinceId, untilId, sinceDate, untilDate].filter(x => x != null).length > 1) {
		throw 'only one of sinceId, untilId, sinceDate, untilDate can be specified';
	}

	const q = userId !== undefined
		? { _id: userId }
		: { usernameLower: username.toLowerCase(), host: getHostLower(host) } ;

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

	if (withFiles) {
		query.fileIds = {
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
