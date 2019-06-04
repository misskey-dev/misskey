import { EntityRepository, Repository } from 'typeorm';
import { NoteFavorite } from '../entities/note-favorite';
import { Notes } from '..';
import { ensure } from '../../prelude/ensure';
import { types, bool } from '../../misc/schema';

@EntityRepository(NoteFavorite)
export class NoteFavoriteRepository extends Repository<NoteFavorite> {
	public async pack(
		src: NoteFavorite['id'] | NoteFavorite,
		me?: unknown
	) {
		const favorite = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return {
			id: favorite.id,
			createdAt: favorite.createdAt,
			noteId: favorite.noteId,
			note: await Notes.pack(favorite.note || favorite.noteId, me),
		};
	}

	public packMany(
		favorites: unknown[],
		me: unknown
	) {
		return Promise.all(favorites.map(x => this.pack(x, me)));
	}
}

export const packedNoteFavoriteSchema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		id: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
			description: 'The unique identifier for this favorite.',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'date-time',
			description: 'The date that the favorite was created.'
		},
		note: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			ref: 'Note',
		},
		noteId: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
		},
	},
};
