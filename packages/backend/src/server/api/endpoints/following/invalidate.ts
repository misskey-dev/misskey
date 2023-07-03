import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository, FollowingsRepository } from '@/models/index.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../error.js';
import { GetterService } from '@/server/api/GetterService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'following/invalidate'> {
	name = 'following/invalidate' as const;
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
		private getterService: GetterService,
		private userFollowingService: UserFollowingService,
	) {
		super(async (ps, me) => {
			const followee = me;

			// Check if the follower is yourself
			if (me.id === ps.userId) {
				throw new ApiError(this.meta.errors.followerIsYourself);
			}

			// Get follower
			const follower = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(this.meta.errors.noSuchUser);
				throw err;
			});

			// Check not following
			const exist = await this.followingsRepository.findOneBy({
				followerId: follower.id,
				followeeId: followee.id,
			});

			if (exist == null) {
				throw new ApiError(this.meta.errors.notFollowing);
			}

			await this.userFollowingService.unfollow(follower, followee);

			return await this.userEntityService.pack(followee.id, me);
		});
	}
}
