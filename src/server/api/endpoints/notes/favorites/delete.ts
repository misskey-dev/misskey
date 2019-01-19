import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import Favorite from '../../../../../models/favorite';
import Note from '../../../../../models/note';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定した投稿のお気に入りを解除します。',
		'en-US': 'Unfavorite a note.'
	},

	requireCredential: true,

	kind: 'favorite-write',

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
		Favorite.findOne({
			noteId: x._id,
			userId: user._id
		}))
	.then(x =>
		x === null ? error('already not favorited') :
		Favorite.remove({ _id: x._id }))
	.then(() => {}));
