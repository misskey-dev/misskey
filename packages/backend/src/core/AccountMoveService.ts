import { Inject, Injectable } from '@nestjs/common';

import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type { LocalUser } from '@/models/entities/User.js';
import { User } from '@/models/entities/User.js';
import type { FollowingsRepository, UsersRepository } from '@/models/index.js';

import { GlobalEventService } from '@/core/GlobalEventService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { ApDeliverManagerService } from '@/core/activitypub/ApDeliverManagerService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { AccountUpdateService } from '@/core/AccountUpdateService.js';

@Injectable()
export class AccountMoveService {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
		private apRendererService: ApRendererService,
		private apDeliverManagerService: ApDeliverManagerService,
		private globalEventService: GlobalEventService,
		private userFollowingService: UserFollowingService,
		private accountUpdateService: AccountUpdateService,
	) {
	}

	/**
	 * Move a local account to a remote account.
	 *
	 * After delivering Move activity, its local followers unfollow the old account and then follow the new one.
	 */
	@bindThis
	public async moveToRemote(src: LocalUser, dst: User): Promise<unknown> {
		// Make sure that the destination is a remote account.
		if (this.userEntityService.isLocalUser(dst)) throw new Error('move destiantion is not remote');

		const updates: Partial<User> = { movedToUri: dst.uri };

		await this.usersRepository.update(src.id, updates);

		// Deliver Move activity to the followers of the old account
		const moveAct = this.apRendererService.renderMove(src, dst);
		await this.apDeliverManagerService.deliverToFollowers(src, moveAct);

		// Publish meUpdated event
		const iObj = await this.userEntityService.pack<true, true>(src.id, src, { detail: true, includeSecrets: true });
		this.globalEventService.publishMainStream(src.id, 'meUpdated', iObj);

		const followings = await this.followingsRepository.findBy({
			followeeId: src.id,
		});
		followings.forEach(async (following) => {
			// If follower is local
			if (!following.followerHost) {
				try {
					const follower = await this.usersRepository.findOneBy({ id: following.followerId });
					if (!follower) return;
					await this.userFollowingService.unfollow(follower, src);
					await this.userFollowingService.follow(follower, dst);
				} catch {
					/* empty */
				}
			}
		});

		return iObj;
	}

	/**
	 * Create an alias of an old remote account.
	 *
	 * The user's new profile will be published to the followers.
	 */
	@bindThis
	public async createAlias(me: LocalUser, updates: Partial<User>): Promise<unknown> {
		await this.usersRepository.update(me.id, updates);

		// Publish meUpdated event
		const iObj = await this.userEntityService.pack<true, true>(me.id, me, {
			detail: true,
			includeSecrets: true,
		});
		this.globalEventService.publishMainStream(me.id, 'meUpdated', iObj);

		if (me.isLocked === false) {
			await this.userFollowingService.acceptAllFollowRequests(me);
		}

		this.accountUpdateService.publishToFollowers(me.id);

		return iObj;
	}
}
