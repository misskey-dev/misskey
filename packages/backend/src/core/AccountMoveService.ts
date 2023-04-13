import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';

import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { LocalUser } from '@/models/entities/User.js';
import type { BlockingsRepository, FollowingsRepository, Muting, MutingsRepository, UserListJoiningsRepository, UsersRepository } from '@/models/index.js';
import type { RelationshipJobData, ThinUser } from '@/queue/types.js';

import { User } from '@/models/entities/User.js';

import { AccountUpdateService } from '@/core/AccountUpdateService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { QueueService } from '@/core/QueueService.js';
import { RelayService } from '@/core/RelayService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { ApDeliverManagerService } from '@/core/activitypub/ApDeliverManagerService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { IdService } from '@/core/IdService.js';
import { CacheService } from '@/core/CacheService';
import { ProxyAccountService } from '@/core/ProxyAccountService.js';

@Injectable()
export class AccountMoveService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.blockingsRepository)
		private blockingsRepository: BlockingsRepository,

		@Inject(DI.mutingsRepository)
		private mutingsRepository: MutingsRepository,

		@Inject(DI.userListJoiningsRepository)
		private userListJoiningsRepository: UserListJoiningsRepository,

		private idService: IdService,
		private userEntityService: UserEntityService,
		private apRendererService: ApRendererService,
		private apDeliverManagerService: ApDeliverManagerService,
		private globalEventService: GlobalEventService,
		private userFollowingService: UserFollowingService,
		private accountUpdateService: AccountUpdateService,
		private proxyAccountService: ProxyAccountService,
		private relayService: RelayService,
		private cacheService: CacheService,
		private queueService: QueueService,
	) {
	}

	/**
	 * Move a local account to a new account.
	 *
	 * After delivering Move activity, its local followers unfollow the old account and then follow the new one.
	 */
	@bindThis
	public async moveFromLocal(src: LocalUser, dst: User): Promise<unknown> {
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

		// Move!
		await this.move(src, dst);

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

	@bindThis
	public async move(src: User, dst: User): Promise<void> {
		// Copy blockings and mutings, and update lists
		await Promise.all([
			this.copyBlocking(src, dst),
			this.copyMutings(src, dst),
			this.updateLists(src, dst),
		]);

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
		const followJobs: RelationshipJobData[] = [];
		const unfollowJobs: RelationshipJobData[] = [];
		for (const following of followings) {
			if (!following.follower) continue;
			followJobs.push({ from: { id: following.follower.id }, to: { id: dst.id } });
			unfollowJobs.push({ from: { id: following.follower.id }, to: { id: src.id } });
		}
		// Should be queued because this can cause a number of follow/unfollow per one move.
		// No need to care job orders as there should be no overlaps of follow/unfollow target.
		this.queueService.createFollowJob(followJobs);
		this.queueService.createUnfollowJob(unfollowJobs);
	}

	@bindThis
	public async copyBlocking(src: ThinUser, dst: ThinUser): Promise<void> {
		// Followers shouldn't overlap with blockers, but the destination account, different from the blockee (i.e., old account), may have followed the local user before moving.
		// So block the destination account here.
		const blockings = await this.blockingsRepository.find({ // FIXME: might be expensive
			relations: {
				blocker: true
			},
			where: {
				blockeeId: src.id
			}
		});
		// reblock the destination account
		const blockJobs: RelationshipJobData[] = [];
		for (const blocking of blockings) {
			if (!blocking.blocker) continue;
			blockJobs.push({ from: { id: blocking.blocker.id }, to: { id: dst.id } });
		}
		// no need to unblock the old account because it may be still functional
		this.queueService.createBlockJob(blockJobs);
	}

	@bindThis
	public async copyMutings(src: ThinUser, dst: ThinUser): Promise<void> {
		// Insert new mutings with the same values except mutee
		const mutings = await this.mutingsRepository.findBy({ muteeId: src.id });
		const newMuting: Partial<Muting>[] = [];
		for (const muting of mutings) {
			newMuting.push({
				id: this.idService.genId(),
				createdAt: new Date(),
				expiresAt: muting.expiresAt,
				muterId: muting.muterId,
				muteeId: dst.id,
			});
		}
		this.mutingsRepository.insert(mutings); // no need to wait
		for (const mute of mutings) {
			if (mute.muter) this.cacheService.userMutingsCache.refresh(mute.muter.id);
		}
		// no need to unmute the old account because it may be still functional
	}

	@bindThis
	public async updateLists(src: ThinUser, dst: User): Promise<void> {
		// Return if there is no list to be updated.
		const exists = await this.userListJoiningsRepository.exist({
			where: {
				userId: src.id,
			},
		});
		if (!exists) return;

		await this.userListJoiningsRepository.update(
			{ userId: src.id },
			{ userId: dst.id, user: dst }
		);

		// Have the proxy account follow the new account in the same way as UserListService.push
		if (this.userEntityService.isRemoteUser(dst)) {
			const proxy = await this.proxyAccountService.fetch();
			if (proxy) {
				this.queueService.createFollowJob([{ from: { id: proxy.id }, to: { id: dst.id } }]);
			}
		}
	}

	@bindThis
	public getUserUri(user: User): string {
			return this.userEntityService.isRemoteUser(user)
				? user.uri : `${this.config.url}/users/${user.id}`;
	}
}
