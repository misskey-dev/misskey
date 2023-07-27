/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { PageLikesRepository } from '@/models/index.js';
import type { } from '@/models/entities/Blocking.js';
import type { User } from '@/models/entities/User.js';
import type { PageLike } from '@/models/entities/PageLike.js';
import { bindThis } from '@/decorators.js';
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
		src: PageLike['id'] | PageLike,
		me?: { id: User['id'] } | null | undefined,
	) {
		const like = typeof src === 'object' ? src : await this.pageLikesRepository.findOneByOrFail({ id: src });

		return {
			id: like.id,
			page: await this.pageEntityService.pack(like.page ?? like.pageId, me),
		};
	}

	@bindThis
	public packMany(
		likes: any[],
		me: { id: User['id'] },
	) {
		return Promise.all(likes.map(x => this.pack(x, me)));
	}
}

