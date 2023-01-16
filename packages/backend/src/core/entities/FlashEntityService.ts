import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { FlashsRepository, FlashLikesRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/Blocking.js';
import type { User } from '@/models/entities/User.js';
import type { Flash } from '@/models/entities/Flash.js';
import { bindThis } from '@/decorators.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class FlashEntityService {
	constructor(
		@Inject(DI.flashsRepository)
		private flashsRepository: FlashsRepository,

		@Inject(DI.flashLikesRepository)
		private flashLikesRepository: FlashLikesRepository,

		private userEntityService: UserEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: Flash['id'] | Flash,
		me?: { id: User['id'] } | null | undefined,
	): Promise<Packed<'Flash'>> {
		const meId = me ? me.id : null;
		const flash = typeof src === 'object' ? src : await this.flashsRepository.findOneByOrFail({ id: src });

		return await awaitAll({
			id: flash.id,
			createdAt: flash.createdAt.toISOString(),
			updatedAt: flash.updatedAt.toISOString(),
			userId: flash.userId,
			user: this.userEntityService.pack(flash.user ?? flash.userId, me), // { detail: true } すると無限ループするので注意
			title: flash.title,
			summary: flash.summary,
			script: flash.script,
			likedCount: flash.likedCount,
			isLiked: meId ? await this.flashLikesRepository.findOneBy({ flashId: flash.id, userId: meId }).then(x => x != null) : undefined,
		});
	}

	@bindThis
	public packMany(
		flashs: Flash[],
		me?: { id: User['id'] } | null | undefined,
	) {
		return Promise.all(flashs.map(x => this.pack(x, me)));
	}
}

