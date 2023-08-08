import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { FollowRequestsRepository } from '@/models/index.js';
import type { User } from '@/models/entities/User.js';
import type { FollowRequest } from '@/models/entities/FollowRequest.js';
import { bindThis } from '@/decorators.js';
import { Packed } from '@/misc/json-schema.js';
import { UserEntityService } from './UserEntityService.js';

@Injectable()
export class FollowRequestEntityService {
	constructor(
		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		private userEntityService: UserEntityService,
	) {
	}

	@bindThis
	public async pack(
		src: FollowRequest['id'] | FollowRequest,
		me: { id: User['id'] } | null | undefined,
	) : Promise<Packed<'FollowRequest'>> {
		const request = typeof src === 'object' ? src : await this.followRequestsRepository.findOneByOrFail({ id: src });

		return {
			id: request.id,
			follower: await this.userEntityService.pack(request.followerId, me),
			followee: await this.userEntityService.pack(request.followeeId, me),
		};
	}

	@bindThis
	public async packMany(
		requests: (FollowRequest['id'] | FollowRequest)[],
		me: { id: User['id'] } | null | undefined,
	) : Promise<Packed<'FollowRequest'>[]> {
		return (await Promise.allSettled(requests.map(x => this.pack(x, me))))
			.filter(result => result.status === 'fulfilled')
			.map(result => (result as PromiseFulfilledResult<Packed<'FollowRequest'>>).value);
	}
}
