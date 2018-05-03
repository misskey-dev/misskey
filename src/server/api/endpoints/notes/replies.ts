/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import Note, { pack } from '../../../../models/note';

/**
 * Show a replies of a note
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $.type(ID).get(params.noteId);
	if (noteIdErr) return rej('invalid noteId param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $.num.optional().range(1, 100).get(params.limit);
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $.num.optional().min(0).get(params.offset);
	if (offsetErr) return rej('invalid offset param');

	// Get 'sort' parameter
	const [sort = 'desc', sortError] = $.str.optional().or('desc asc').get(params.sort);
	if (sortError) return rej('invalid sort param');

	// Lookup note
	const note = await Note.findOne({
		_id: noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	// Issue query
	const replies = await Note
		.find({ replyId: note._id }, {
			limit: limit,
			skip: offset,
			sort: {
				_id: sort == 'asc' ? 1 : -1
			}
		});

	// Serialize
	res(await Promise.all(replies.map(async note =>
		await pack(note, user))));
});
