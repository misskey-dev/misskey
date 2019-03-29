import { EntityRepository, Repository } from 'typeorm';
import { NoteFavorite } from '../entities/note-favorite';
import { Notes } from '..';

@EntityRepository(NoteFavorite)
export class NoteFavoriteRepository extends Repository<NoteFavorite> {
	public packMany(
		favorites: any[],
		me: any
	) {
		return Promise.all(favorites.map(x => this.pack(x, me)));
	}

	public async pack(
		favorite: NoteFavorite['id'] | NoteFavorite,
		me?: any
	) {
		const _favorite = typeof favorite === 'object' ? favorite : await this.findOne(favorite);

		return {
			id: _favorite.id,
			note: await Notes.pack(_favorite.note || _favorite.noteId, me),
		};
	}
}
