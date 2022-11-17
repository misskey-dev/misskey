import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { HashtagsRepository } from '@/models/index.js';
import { awaitAll } from '@/misc/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/Blocking.js';
import type { User } from '@/models/entities/User.js';
import type { Hashtag } from '@/models/entities/Hashtag.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class HashtagEntityService {
	constructor(
		@Inject(DI.hashtagsRepository)
		private hashtagsRepository: HashtagsRepository,

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

