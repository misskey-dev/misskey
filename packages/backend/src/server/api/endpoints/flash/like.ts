import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository, FlashLikesRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'flash/like'> {
	name = 'flash/like' as const;
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		@Inject(DI.flashLikesRepository)
		private flashLikesRepository: FlashLikesRepository,

		private idService: IdService,
	) {
		super(async (ps, me) => {
			const flash = await this.flashsRepository.findOneBy({ id: ps.flashId });
			if (flash == null) {
				throw new ApiError(this.meta.errors.noSuchFlash);
			}

			if (flash.userId === me.id) {
				throw new ApiError(this.meta.errors.yourFlash);
			}

			// if already liked
			const exist = await this.flashLikesRepository.findOneBy({
				flashId: flash.id,
				userId: me.id,
			});

			if (exist != null) {
				throw new ApiError(this.meta.errors.alreadyLiked);
			}

			// Create like
			await this.flashLikesRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				flashId: flash.id,
				userId: me.id,
			});

			this.flashsRepository.increment({ id: flash.id }, 'likedCount', 1);
		});
	}
}
