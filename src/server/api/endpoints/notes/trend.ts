/**
 * Module dependencies
 */
const ms = require('ms');
import $ from 'cafy';
import Note, { pack } from '../../../../models/note';

/**
 * Get trend notes
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $.num.optional().range(1, 100).get(params.limit);
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $.num.optional().min(0).get(params.offset);
	if (offsetErr) return rej('invalid offset param');

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

	const query = {
		_id: { $gte: new Date(Date.now() - ms('1days')) },
		renoteCount: { $gt: 0 },
		'_user.host': null
	} as any;

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

	// Issue query
	const notes = await Note
		.find(query, {
			limit: limit,
			skip: offset,
			sort: {
				renoteCount: -1,
				_id: -1
			}
		});

	// Serialize
	res(await Promise.all(notes.map(async note =>
		await pack(note, user, { detail: true }))));
});
