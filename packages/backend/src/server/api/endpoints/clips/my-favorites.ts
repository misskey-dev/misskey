import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { ClipFavoritesRepository } from '@/models/index.js';
import { DI } from '@/di-symbols.js';
import { ClipEntityService } from '@/core/entities/ClipEntityService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'clips/my-favorites'> {
	name = 'clips/my-favorites' as const;
	constructor(
		@Inject(DI.clipFavoritesRepository)
		private clipFavoritesRepository: ClipFavoritesRepository,

		private clipEntityService: ClipEntityService,
	) {
		super(async (ps, me) => {
			const query = this.clipFavoritesRepository.createQueryBuilder('favorite')
				.andWhere('favorite.userId = :meId', { meId: me.id })
				.leftJoinAndSelect('favorite.clip', 'clip');

			const favorites = await query
				.getMany();

			return this.clipEntityService.packMany(favorites.map(x => x.clip!), me);
		});
	}
}
