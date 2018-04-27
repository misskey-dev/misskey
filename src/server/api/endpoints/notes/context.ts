/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import Note, { pack } from '../../../../models/note';

/**
 * Show a context of a note
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $(params.noteId).type(ID).get();
	if (noteIdErr) return rej('invalid noteId param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).get();
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $(params.offset).optional.number().min(0).get();
	if (offsetErr) return rej('invalid offset param');

	// Lookup note
	const note = await Note.findOne({
		_id: noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	const context = [];
	let i = 0;

	async function get(id) {
		i++;
		const p = await Note.findOne({ _id: id });

		if (i > offset) {
			context.push(p);
		}

		if (context.length == limit) {
			return;
		}

		if (p.replyId) {
			await get(p.replyId);
		}
	}

	if (note.replyId) {
		await get(note.replyId);
	}

	// Serialize
	res(await Promise.all(context.map(async note =>
		await pack(note, user))));
});
