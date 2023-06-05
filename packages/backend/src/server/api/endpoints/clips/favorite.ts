import { Inject, Injectable } from '@nestjs/common';
import type { ClipsRepository, ClipFavoritesRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'clips/favorite'> {
	name = 'clips/favorite' as const;
	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(DI.clipFavoritesRepository)
		private clipFavoritesRepository: ClipFavoritesRepository,

		private idService: IdService,
	) {
		super(async (ps, me) => {
			const clip = await this.clipsRepository.findOneBy({ id: ps.clipId });
			if (clip == null) {
				throw new ApiError(this.meta.errors.noSuchClip);
			}
			if ((clip.userId !== me.id) && !clip.isPublic) {
				throw new ApiError(this.meta.errors.noSuchClip);
			}

			const exist = await this.clipFavoritesRepository.findOneBy({
				clipId: clip.id,
				userId: me.id,
			});

			if (exist != null) {
				throw new ApiError(this.meta.errors.alreadyFavorited);
			}

			await this.clipFavoritesRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				clipId: clip.id,
				userId: me.id,
			});
		});
	}
}
