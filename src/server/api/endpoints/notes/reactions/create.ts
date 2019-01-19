import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import Note from '../../../../../models/note';
import create from '../../../../../services/note/reaction/create';
import { validateReaction } from '../../../../../models/note-reaction';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定した投稿にリアクションします。',
		'en-US': 'React to a note.'
	},

	requireCredential: true,

	kind: 'reaction-write',

	params: {
		noteId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象の投稿'
			}
		},

		reaction: {
			validator: $.str.pipe(validateReaction.ok),
			desc: {
				'ja-JP': 'リアクションの種類'
			}
		}
	}
};

export default define(meta, (ps, user) => Note.findOne({ _id: ps.noteId })
	.then(x =>
		x === null ? error('note not found') :
		x.deletedAt ? error('this not is already deleted') :
		create(user, x, ps.reaction)));
