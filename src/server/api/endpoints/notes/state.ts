import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../define';
import { NoteFavorites, NoteWatchings } from '../../../../models';

export const meta = {
	tags: ['notes'],

	requireCredential: true as const,

	params: {
		noteId: {
			validator: $.type(ID),
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		properties: {
			isFavorited: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const
			},
			isWatching: {
				type: 'boolean' as const,
				optional: false as const, nullable: false as const
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
