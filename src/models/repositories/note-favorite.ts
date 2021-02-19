import { EntityRepository, Repository } from 'typeorm';
import { NoteFavorite } from '../entities/note-favorite';
import { Notes } from '..';

@EntityRepository(NoteFavorite)
export class NoteFavoriteRepository extends Repository<NoteFavorite> {
	public async pack(
		src: NoteFavorite['id'] | NoteFavorite,
		me?: any
	) {
		const favorite = typeof src === 'object' ? src : await this.findOneOrFail(src);

		return {
			id: favorite.id,
			createdAt: favorite.createdAt,
			noteId: favorite.noteId,
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

export const packedNoteFavoriteSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			description: 'The unique identifier for this favorite.',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
			description: 'The date that the favorite was created.'
		},
		note: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'Note',
		},
		noteId: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
		},
	},
};
