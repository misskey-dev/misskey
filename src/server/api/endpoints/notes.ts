/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../cafy-id';
import Note, { pack } from '../../../models/note';

/**
 * Get all notes
 */
module.exports = (params) => new Promise(async (res, rej) => {
	// Get 'local' parameter
	const [local, localErr] = $.bool.optional().get(params.local);
	if (localErr) return rej('invalid local param');

	// Get 'reply' parameter
	const [reply, replyErr] = $.bool.optional().get(params.reply);
	if (replyErr) return rej('invalid reply param');

	// Get 'renote' parameter
	const [renote, renoteErr] = $.bool.optional().get(params.renote);
	if (renoteErr) return rej('invalid renote param');

	// Get 'media' parameter
	const [media, mediaErr] = $.bool.optional().get(params.media);
	if (mediaErr) return rej('invalid media param');

	// Get 'poll' parameter
	const [poll, pollErr] = $.bool.optional().get(params.poll);
	if (pollErr) return rej('invalid poll param');

	// Get 'bot' parameter
	//const [bot, botErr] = $.bool.optional().get(params.bot);
	//if (botErr) return rej('invalid bot param');

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
	const sort = {
		_id: -1
	};
	const query = {} as any;
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

	if (local) {
		query['_user.host'] = null;
	}

	if (reply != undefined) {
		query.replyId = reply ? { $exists: true, $ne: null } : null;
	}

	if (renote != undefined) {
		query.renoteId = renote ? { $exists: true, $ne: null } : null;
	}

	if (media != undefined) {
		query.mediaIds = media ? { $exists: true, $ne: null } : [];
	}

	if (poll != undefined) {
		query.poll = poll ? { $exists: true, $ne: null } : null;
	}

	// TODO
	//if (bot != undefined) {
	//	query.isBot = bot;
	//}

	// Issue query
	const notes = await Note
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(notes.map(note => pack(note))));
});
