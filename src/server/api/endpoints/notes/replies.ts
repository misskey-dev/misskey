import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import Note, { packMany } from '../../../../models/note';
import { ILocalUser } from '../../../../models/user';

/**
 * Get replies of a note
 */
export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $.type(ID).get(params.noteId);
	if (noteIdErr) return rej('invalid noteId param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $.num.optional.range(1, 100).get(params.limit);
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset = 0, offsetErr] = $.num.optional.min(0).get(params.offset);
	if (offsetErr) return rej('invalid offset param');

	// Lookup note
	const note = await Note.findOne({
		_id: noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	const ids = (note._replyIds || []).slice(offset, offset + limit);

	// Serialize
	res(await packMany(ids, user));
});
