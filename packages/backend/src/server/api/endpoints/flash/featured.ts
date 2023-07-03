import { Inject, Injectable } from '@nestjs/common';
import type { FlashsRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { FlashEntityService } from '@/core/entities/FlashEntityService.js';
import { DI } from '@/di-symbols.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'flash/featured'> {
	name = 'flash/featured' as const;
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		private flashEntityService: FlashEntityService,
	) {
		super(async (ps, me) => {
			const query = this.flashsRepository.createQueryBuilder('flash')
				.andWhere('flash.likedCount > 0')
				.orderBy('flash.likedCount', 'DESC');

			const flashs = await query.take(10).getMany();

			return await this.flashEntityService.packMany(flashs, me);
		});
	}
}
