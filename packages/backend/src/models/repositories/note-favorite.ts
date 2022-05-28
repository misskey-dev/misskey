import { db } from '@/db/postgre.js';
import { NoteFavorite } from '@/models/entities/note-favorite.js';
import { Notes } from '../index.js';
import { User } from '@/models/entities/user.js';

export const NoteFavoriteRepository = db.getRepository(NoteFavorite).extend({
	async pack(
		src: NoteFavorite['id'] | NoteFavorite,
		me?: { id: User['id'] } | null | undefined
	) {
		const favorite = typeof src === 'object' ? src : await this.findOneByOrFail({ id: src });

		return {
			id: favorite.id,
			createdAt: favorite.createdAt.toISOString(),
			noteId: favorite.noteId,
			// may throw error
			note: await Notes.pack(favorite.note || favorite.noteId, me),
		};
	},

	packMany(
		favorites: any[],
		me: { id: User['id'] }
	) {
		return Promise.allSettled(favorites.map(x => this.pack(x, me)))
		.then(promises => promises.flatMap(result => result.status === 'fulfilled' ? [result.value] : []));
	},
});
