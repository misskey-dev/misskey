import { Inject, Injectable } from '@nestjs/common';
import type { ClipsRepository, ClipFavoritesRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'clips/unfavorite'> {
	name = 'clips/unfavorite' as const;
	constructor(
		@Inject(DI.clipsRepository)
		private clipsRepository: ClipsRepository,

		@Inject(DI.clipFavoritesRepository)
		private clipFavoritesRepository: ClipFavoritesRepository,
	) {
		super(async (ps, me) => {
			const clip = await this.clipsRepository.findOneBy({ id: ps.clipId });
			if (clip == null) {
				throw new ApiError(this.meta.errors.noSuchClip);
			}

			const exist = await this.clipFavoritesRepository.findOneBy({
				clipId: clip.id,
				userId: me.id,
			});

			if (exist == null) {
				throw new ApiError(this.meta.errors.notFavorited);
			}

			await this.clipFavoritesRepository.delete(exist.id);
		});
	}
}
