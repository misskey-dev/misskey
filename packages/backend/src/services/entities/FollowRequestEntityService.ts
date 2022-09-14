import { Inject, Injectable } from '@nestjs/common';
import { DI_SYMBOLS } from '@/di-symbols.js';
import type { FollowRequests } from '@/models/index.js';
import { awaitAll } from '@/prelude/await-all.js';
import type { Packed } from '@/misc/schema.js';
import type { } from '@/models/entities/blocking.js';
import type { User } from '@/models/entities/user.js';
import type { FollowRequest } from '@/models/entities/follow-request.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class FollowRequestEntityService {
	constructor(
		@Inject('followRequestsRepository')
		private followRequestsRepository: typeof FollowRequests,

		private userEntityService: UserEntityService,
	) {
	}

	public async pack(
		src: FollowRequest['id'] | FollowRequest,
		me?: { id: User['id'] } | null | undefined,
	) {
		const request = typeof src === 'object' ? src : await this.followRequestsRepository.findOneByOrFail({ id: src });

		return {
			id: request.id,
			follower: await this.userEntityService.pack(request.followerId, me),
			followee: await this.userEntityService.pack(request.followeeId, me),
		};
	}
}

