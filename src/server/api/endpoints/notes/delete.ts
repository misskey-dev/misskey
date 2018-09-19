import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import deleteNote from '../../../../services/note/delete';
import { ILocalUser } from '../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿を削除します。',
		'en-US': 'Delete a note.'
	},

	requireCredential: true,

	kind: 'note-write'
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'noteId' parameter
	const [noteId, noteIdErr] = $.type(ID).get(params.noteId);
	if (noteIdErr) return rej('invalid noteId param');

	// Fetch note
	const note = await Note.findOne({
		_id: noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	if (!user.isAdmin && !note.userId.equals(user._id)) {
		return rej('access denied');
	}

	await deleteNote(user, note);

	res();
});
