import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note from '../../../../models/note';
import deleteNote from '../../../../services/note/delete';
import User from '../../../../models/user';
import define from '../../define';
import { error } from '../../../../prelude/promise';
const ms = require('ms');

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

export default define(meta, (ps, user) => Note.findOne({ _id: ps.noteId })
	.then(note =>
		note === null ? error('note not found') :
		!user.isAdmin && !user.isModerator && !note.userId.equals(user._id) ? error('access denied') :
		User.findOne({ _id: note.userId })
			.then(x => deleteNote(x, note))));
