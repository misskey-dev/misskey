import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository, FlashLikesRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'flash/unlike'> {
	name = 'flash/unlike' as const;
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		@Inject(DI.flashLikesRepository)
		private flashLikesRepository: FlashLikesRepository,
	) {
		super(async (ps, me) => {
			const flash = await this.flashsRepository.findOneBy({ id: ps.flashId });
			if (flash == null) {
				throw new ApiError(this.meta.errors.noSuchFlash);
			}

			const exist = await this.flashLikesRepository.findOneBy({
				flashId: flash.id,
				userId: me.id,
			});

			if (exist == null) {
				throw new ApiError(this.meta.errors.notLiked);
			}

			// Delete like
			await this.flashLikesRepository.delete(exist.id);

			this.flashsRepository.decrement({ id: flash.id }, 'likedCount', 1);
		});
	}
}
