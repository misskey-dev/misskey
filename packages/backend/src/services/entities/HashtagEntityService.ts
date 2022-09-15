import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Hashtags } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/blocking.js';
import type { User } from '@/models/entities/user.js';
import type { Hashtag } from '@/models/entities/hashtag.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class HashtagEntityService {
	constructor(
		@Inject('hashtagsRepository')
		private hashtagsRepository: typeof Hashtags,

		private userEntityService: UserEntityService,
	) {
	}

	public async pack(
		src: Hashtag,
	): Promise<Packed<'Hashtag'>> {
		return {
			tag: src.name,
			mentionedUsersCount: src.mentionedUsersCount,
			mentionedLocalUsersCount: src.mentionedLocalUsersCount,
			mentionedRemoteUsersCount: src.mentionedRemoteUsersCount,
			attachedUsersCount: src.attachedUsersCount,
			attachedLocalUsersCount: src.attachedLocalUsersCount,
			attachedRemoteUsersCount: src.attachedRemoteUsersCount,
		};
	}

	public packMany(
		hashtags: Hashtag[],
	) {
		return Promise.all(hashtags.map(x => this.pack(x)));
	}
}

