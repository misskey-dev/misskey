import ms from 'ms';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository, FollowingsRepository } from '@/models/index.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { DI } from '@/di-symbols.js';
import { GetterService } from '@/server/api/GetterService.js';
import { ApiError } from '../../error.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'following/create'> {
	name = 'following/create' as const;
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
			const follower = me;

			// 自分自身
			if (me.id === ps.userId) {
				throw new ApiError(this.meta.errors.followeeIsYourself);
			}

			// Get followee
			const followee = await this.getterService.getUser(ps.userId).catch(err => {
				if (err.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(this.meta.errors.noSuchUser);
				throw err;
			});

			// Check if already following
			const exist = await this.followingsRepository.findOneBy({
				followerId: follower.id,
				followeeId: followee.id,
			});

			if (exist != null) {
				throw new ApiError(this.meta.errors.alreadyFollowing);
			}

			try {
				await this.userFollowingService.follow(follower, followee);
			} catch (e) {
				if (e instanceof IdentifiableError) {
					if (e.id === '710e8fb0-b8c3-4922-be49-d5d93d8e6a6e') throw new ApiError(this.meta.errors.blocking);
					if (e.id === '3338392a-f764-498d-8855-db939dcf8c48') throw new ApiError(this.meta.errors.blocked);
				}
				throw e;
			}

			return await this.userEntityService.pack(followee.id, me);
		});
	}
}
