import $ from 'cafy';
import { ID } from '../../../../misc/cafy-id';
import define from '../../define';
import { NoteFavorites, NoteWatchings } from '../../../../models';

export const meta = {
	desc: {
		'ja-JP': '指定した投稿の状態を取得します。',
		'en-US': 'Get state of a note.'
	},

	tags: ['notes'],

	requireCredential: true as const,

	params: {
		noteId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象の投稿のID',
				'en-US': 'Target note ID.'
			}
		}
	}
};

export default define(meta, async (ps, user) => {
	const [favorite, watching] = await Promise.all([
		NoteFavorites.count({
			where: {
				userId: user.id,
				noteId: ps.noteId
			},
			take: 1
		}),
		NoteWatchings.count({
			where: {
				userId: user.id,
				noteId: ps.noteId
			},
			take: 1
		})
	]);

	return {
		isFavorited: favorite !== 0,
		isWatching: watching !== 0
	};
});
