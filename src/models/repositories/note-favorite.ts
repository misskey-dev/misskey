import { EntityRepository, Repository } from 'typeorm';
import { NoteFavorite } from '../entities/note-favorite';
import { Notes } from '..';
import { ensure } from '../../prelude/ensure';

@EntityRepository(NoteFavorite)
export class NoteFavoriteRepository extends Repository<NoteFavorite> {
	public async pack(
		src: NoteFavorite['id'] | NoteFavorite,
		me?: any
	) {
		const favorite = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return {
			id: favorite.id,
			note: await Notes.pack(favorite.note || favorite.noteId, me),
		};
	}

	public packMany(
		favorites: any[],
		me: any
	) {
		return Promise.all(favorites.map(x => this.pack(x, me)));
	}
}
