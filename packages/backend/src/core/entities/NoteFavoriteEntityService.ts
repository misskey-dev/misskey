import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { NoteFavoritesRepository } from '@/models/index.js';
import type { User } from '@/models/entities/User.js';
import type { NoteFavorite } from '@/models/entities/NoteFavorite.js';
import { bindThis } from '@/decorators.js';
import { Packed } from '@/misc/json-schema.js';
import { NoteEntityService } from './NoteEntityService.js';

@Injectable()
export class NoteFavoriteEntityService {
	constructor(
		@Inject(DI.noteFavoritesRepository)
		private noteFavoritesRepository: NoteFavoritesRepository,

		private noteEntityService: NoteEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: NoteFavorite['id'] | NoteFavorite,
		me: { id: User['id'] } | null | undefined,
	) : Promise<Packed<'NoteFavorite'>> {
		const favorite = typeof src === 'object' ? src : await this.noteFavoritesRepository.findOneByOrFail({ id: src });

		return {
			id: favorite.id,
			createdAt: favorite.createdAt.toISOString(),
			noteId: favorite.noteId,
			note: await this.noteEntityService.pack(favorite.note ?? favorite.noteId, me),
		};
	}

	@bindThis
	public async packMany(
		favorites: (NoteFavorite['id'] | NoteFavorite)[],
		me: { id: User['id'] } | null | undefined,
	) : Promise<Packed<'NoteFavorite'>[]> {
		return (await Promise.allSettled(favorites.map(x => this.pack(x, me))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'NoteFavorite'>>).value);
	}
}
