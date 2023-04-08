import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';

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
import { RelayService } from '@/core/RelayService.js';

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
		private relayService: RelayService,
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
		if (!dst.uri) throw new Error('destination uri is empty');

		// add movedToUri to indicate that the user has moved
		const update = {} as Partial<User>;
		update.alsoKnownAs = src.alsoKnownAs?.concat([dst.uri]) ?? [dst.uri];
		update.movedToUri = dst.uri;
		await this.usersRepository.update(src.id, update);

		const srcPerson = await this.apRendererService.renderPerson(src);
		const updateAct = this.apRendererService.addContext(this.apRendererService.renderUpdate(srcPerson, src));
		await this.apDeliverManagerService.deliverToFollowers(src, updateAct);
		this.relayService.deliverToRelays(src, updateAct);

		// Deliver Move activity to the followers of the old account
		const moveAct = this.apRendererService.addContext(this.apRendererService.renderMove(src, dst));
		await this.apDeliverManagerService.deliverToFollowers(src, moveAct);

		// Publish meUpdated event
		const iObj = await this.userEntityService.pack<true, true>(src.id, src, { detail: true, includeSecrets: true });
		this.globalEventService.publishMainStream(src.id, 'meUpdated', iObj);

		// follow the new account and unfollow the old one
		const followings = await this.followingsRepository.find({
			relations: {
				follower: true,
			},
			where: {
				followeeId: src.id,
				followerHost: IsNull(), // follower is local
			},
		});
		for (const following of followings) {
			if (!following.follower) continue;
			try {
				await this.userFollowingService.follow(following.follower, dst);
				await this.userFollowingService.unfollow(following.follower, src);
			} catch {
				/* empty */
			}
		}

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
