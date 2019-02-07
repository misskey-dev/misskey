import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import deleteNote from '../../../../services/note/delete';
import User from '../../../../models/user';
import define from '../../define';
import * as ms from 'ms';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定した投稿を削除します。',
		'en-US': 'Delete a note.'
	},

	requireCredential: true,

	kind: 'note-write',

	limit: {
		duration: ms('1hour'),
		max: 300,
		minInterval: ms('1sec')
	},

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID.'
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Fetch note
	const note = await Note.findOne({
		_id: ps.noteId
	});

	if (note === null) {
		return rej('note not found');
	}

	if (!user.isAdmin && !user.isModerator && !note.userId.equals(user._id)) {
		return rej('access denied');
	}

	await deleteNote(await User.findOne({ _id: note.userId }), note);

	res();
}));
