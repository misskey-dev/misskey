import { EntityRepository, Repository } from 'typeorm';
import { NoteFavorite } from '@/models/entities/note-favorite.js';
import { Notes } from '../index.js';
import { User } from '@/models/entities/user.js';

@EntityRepository(NoteFavorite)
export class NoteFavoriteRepository extends Repository<NoteFavorite> {
	public async pack(
		src: NoteFavorite['id'] | NoteFavorite,
		me?: { id: User['id'] } | null | undefined
	) {
		const favorite = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return {
			id: favorite.id,
			createdAt: favorite.createdAt.toISOString(),
			noteId: favorite.noteId,
			note: await Notes.pack(favorite.note || favorite.noteId, me),
		};
	}

	public packMany(
		favorites: any[],
		me: { id: User['id'] }
	) {
		return Promise.all(favorites.map(x => this.pack(x, me)));
	}
}
