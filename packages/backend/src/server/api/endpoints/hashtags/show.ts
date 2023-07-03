import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { HashtagsRepository } from '@/models/index.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { HashtagEntityService } from '@/core/entities/HashtagEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'hashtags/show'> {
	name = 'hashtags/show' as const;
	constructor(
		@Inject(DI.hashtagsRepository)
		private hashtagsRepository: HashtagsRepository,

		private hashtagEntityService: HashtagEntityService,
	) {
		super(async (ps, me) => {
			const hashtag = await this.hashtagsRepository.findOneBy({ name: normalizeForSearch(ps.tag) });
			if (hashtag == null) {
				throw new ApiError(this.meta.errors.noSuchHashtag);
			}

			return await this.hashtagEntityService.pack(hashtag);
		});
	}
}
