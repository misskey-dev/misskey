/**
 * Module dependencies
 */
import $ from 'cafy';
import Note, { pack } from '../../../models/note';

/**
 * Lists all notes
 *
 * @param {any} params
 * @return {Promise<any>}
 */
module.exports = (params) => new Promise(async (res, rej) => {
	// Get 'reply' parameter
	const [reply, replyErr] = $(params.reply).optional.boolean().$;
	if (replyErr) return rej('invalid reply param');

	// Get 'renote' parameter
	const [renote, renoteErr] = $(params.renote).optional.boolean().$;
	if (renoteErr) return rej('invalid renote param');

	// Get 'media' parameter
	const [media, mediaErr] = $(params.media).optional.boolean().$;
	if (mediaErr) return rej('invalid media param');

	// Get 'poll' parameter
	const [poll, pollErr] = $(params.poll).optional.boolean().$;
	if (pollErr) return rej('invalid poll param');

	// Get 'bot' parameter
	//const [bot, botErr] = $(params.bot).optional.boolean().$;
	//if (botErr) return rej('invalid bot param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $(params.sinceId).optional.id().$;
	if (sinceIdErr) return rej('invalid sinceId param');

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $(params.untilId).optional.id().$;
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

	if (reply != undefined) {
		query.replyId = reply ? { $exists: true, $ne: null } : null;
	}

	if (renote != undefined) {
		query.renoteId = renote ? { $exists: true, $ne: null } : null;
	}

	if (media != undefined) {
		query.mediaIds = media ? { $exists: true, $ne: null } : null;
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
	res(await Promise.all(notes.map(async note => await pack(note))));
});
