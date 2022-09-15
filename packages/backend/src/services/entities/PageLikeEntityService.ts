import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { PageLikes } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/blocking.js';
import type { User } from '@/models/entities/user.js';
import type { PageLike } from '@/models/entities/page-like.js';
import { UserEntityService } from './UserEntityService.js';
import { PageEntityService } from './PageEntityService.js';

@Injectable()
export class PageLikeEntityService {
	constructor(
		@Inject('pageLikesRepository')
		private pageLikesRepository: typeof PageLikes,

		private pageEntityService: PageEntityService,
	) {
	}

	public async pack(
		src: PageLike['id'] | PageLike,
		me?: { id: User['id'] } | null | undefined,
	) {
		const like = typeof src === 'object' ? src : await this.pageLikesRepository.findOneByOrFail({ id: src });

		return {
			id: like.id,
			page: await this.pageEntityService.pack(like.page || like.pageId, me),
		};
	}

	public packMany(
		likes: any[],
		me: { id: User['id'] },
	) {
		return Promise.all(likes.map(x => this.pack(x, me)));
	}
}

