/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { PageLikesRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import type { MiPageLike } from '@/models/PageLike.js';
import { bindThis } from '@/decorators.js';
import { Packed } from '@/misc/json-schema.js';
import { PageEntityService } from './PageEntityService.js';

@Injectable()
export class PageLikeEntityService {
	constructor(
		@Inject(DI.pageLikesRepository)
		private pageLikesRepository: PageLikesRepository,

		private pageEntityService: PageEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: MiPageLike['id'] | MiPageLike,
		me: { id: MiUser['id'] } | null | undefined,
	) : Promise<Packed<'PageLike'>> {
		const like = typeof src === 'object' ? src : await this.pageLikesRepository.findOneByOrFail({ id: src });

		return {
			id: like.id,
			page: await this.pageEntityService.pack(like.page ?? like.pageId, me),
		};
	}

	@bindThis
	public async packMany(
		likes: (MiPageLike['id'] | MiPageLike)[],
		me: { id: MiUser['id'] },
	) : Promise<Packed<'PageLike'>[]> {
		return (await Promise.allSettled(likes.map(x => this.pack(x, me))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'PageLike'>>).value);
	}
}
