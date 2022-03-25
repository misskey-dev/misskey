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
			note: await Notes.pack(favorite.note || favorite.noteId, me),
		};
	},

	packMany(
		favorites: any[],
		me: { id: User['id'] }
	) {
		return Promise.all(favorites.map(x => this.pack(x, me)));
	},
});
