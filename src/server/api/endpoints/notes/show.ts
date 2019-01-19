import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Note, { pack } from '../../../../models/note';
import define from '../../define';
import { error } from '../../../../prelude/promise';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定した投稿を取得します。',
		'en-US': 'Get a note.'
	},

	requireCredential: false,

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
	.then(x =>
		x === null ? error('note not found') :
		pack(x, user, { detail: true })));
