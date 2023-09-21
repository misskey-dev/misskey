import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository, FlashLikesRepository } from '@/models/index.js';
import { IdService } from '@/core/IdService.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

export const meta = {
	tags: ['flash'],

	requireCredential: true,

	kind: 'write:flash-likes',

	errors: {
		noSuchFlash: {
			message: 'No such flash.',
			code: 'NO_SUCH_FLASH',
			id: 'c07c1491-9161-4c5c-9d75-01906f911f73',
		},

		yourFlash: {
			message: 'You cannot like your flash.',
			code: 'YOUR_FLASH',
			id: '3fd8a0e7-5955-4ba9-85bb-bf3e0c30e13b',
		},

		alreadyLiked: {
			message: 'The flash has already been liked.',
			code: 'ALREADY_LIKED',
			id: '010065cf-ad43-40df-8067-abff9f4686e3',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		flashId: { type: 'string', format: 'misskey:id' },
	},
	required: ['flashId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		@Inject(DI.flashLikesRepository)
		private flashLikesRepository: FlashLikesRepository,

		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const flash = await this.flashsRepository.findOneBy({ id: ps.flashId });
			if (flash == null) {
				throw new ApiError(meta.errors.noSuchFlash);
			}

			if (flash.userId === me.id) {
				throw new ApiError(meta.errors.yourFlash);
			}

			// if already liked
			const exist = await this.flashLikesRepository.findOneBy({
				flashId: flash.id,
				userId: me.id,
			});

			if (exist != null) {
				throw new ApiError(meta.errors.alreadyLiked);
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
