import { Inject, Injectable } from '@nestjs/common';
import { IsNull, In, MoreThan, Not } from 'typeorm';

import { bindThis } from '@/decorators.js';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type { LocalUser, RemoteUser } from '@/models/entities/User.js';
import type { BlockingsRepository, FollowingsRepository, InstancesRepository, Muting, MutingsRepository, UserListJoiningsRepository, UsersRepository } from '@/models/index.js';
import type { RelationshipJobData, ThinUser } from '@/queue/types.js';
import type { User } from '@/models/entities/User.js';

import { IdService } from '@/core/IdService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { QueueService } from '@/core/QueueService.js';
import { RelayService } from '@/core/RelayService.js';
import { ApDeliverManagerService } from '@/core/activitypub/ApDeliverManagerService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { CacheService } from '@/core/CacheService.js';
import { ProxyAccountService } from '@/core/ProxyAccountService.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { MetaService } from '@/core/MetaService.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import PerUserFollowingChart from '@/core/chart/charts/per-user-following.js';

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

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
		private apRendererService: ApRendererService,
		private apDeliverManagerService: ApDeliverManagerService,
		private globalEventService: GlobalEventService,
		private proxyAccountService: ProxyAccountService,
		private perUserFollowingChart: PerUserFollowingChart,
		private federatedInstanceService: FederatedInstanceService,
		private instanceChart: InstanceChart,
		private metaService: MetaService,
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
	public async moveFromLocal(src: LocalUser, dst: LocalUser | RemoteUser): Promise<unknown> {
		const dstUri = this.userEntityService.getUserUri(dst);

		// add movedToUri to indicate that the user has moved
		const update = {} as Partial<User>;
		update.alsoKnownAs = src.alsoKnownAs?.includes(dstUri) ? src.alsoKnownAs : src.alsoKnownAs?.concat([dstUri]) ?? [dstUri];
		update.movedToUri = dstUri;
		await this.usersRepository.update(src.id, update);
		src = Object.assign(src, update);

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

		// Unfollow
		const followings = await this.followingsRepository.findBy({
			followerId: src.id,
		});
		this.queueService.createUnfollowJob(followings.map(following => ({
			from: { id: src.id },
			to: { id: following.followeeId },
		})));

		// Move!
		await this.move(src, dst);

		return iObj;
	}

	@bindThis
	public async move(src: User, dst: User): Promise<void> {
		// Copy blockings and mutings, and update lists
		try {
			await Promise.all([
				this.copyBlocking(src, dst),
				this.copyMutings(src, dst),
				this.updateLists(src, dst),
			]);
		} catch {
			/* skip if any error happens */
		}

		// follow the new account
		const proxy = await this.proxyAccountService.fetch();
		const followings = await this.followingsRepository.findBy({
			followeeId: src.id,
			followerHost: IsNull(), // follower is local
			followerId: proxy ? Not(proxy.id) : undefined,
		});
		const followJobs = followings.map(following => ({
			from: { id: following.followerId },
			to: { id: dst.id },
		})) as RelationshipJobData[];

		// Decrease following count instead of unfollowing.
		try {
			await this.adjustFollowingCounts(followJobs.map(job => job.from.id), src);
		} catch {
			/* skip if any error happens */
		}

		// Should be queued because this can cause a number of follow per one move.
		this.queueService.createFollowJob(followJobs);
	}

	@bindThis
	public async copyBlocking(src: ThinUser, dst: ThinUser): Promise<void> {
		// Followers shouldn't overlap with blockers, but the destination account, different from the blockee (i.e., old account), may have followed the local user before moving.
		// So block the destination account here.
		const srcBlockings = await this.blockingsRepository.findBy({ blockeeId: src.id });
		const dstBlockings = await this.blockingsRepository.findBy({ blockeeId: dst.id });
		const blockerIds = dstBlockings.map(blocking => blocking.blockerId);
		// reblock the destination account
		const blockJobs: RelationshipJobData[] = [];
		for (const blocking of srcBlockings) {
			if (blockerIds.includes(blocking.blockerId)) continue; // skip if already blocked
			blockJobs.push({ from: { id: blocking.blockerId }, to: { id: dst.id } });
		}
		// no need to unblock the old account because it may be still functional
		this.queueService.createBlockJob(blockJobs);
	}

	@bindThis
	public async copyMutings(src: ThinUser, dst: ThinUser): Promise<void> {
		// Insert new mutings with the same values except mutee
		const oldMutings = await this.mutingsRepository.findBy([
			{ muteeId: src.id, expiresAt: IsNull() },
			{ muteeId: src.id, expiresAt: MoreThan(new Date()) },
		]);
		if (oldMutings.length === 0) return;

		// Check if the destination account is already indefinitely muted by the muter
		const existingMutingsMuterUserIds = await this.mutingsRepository.findBy(
			{ muteeId: dst.id, expiresAt: IsNull() },
		).then(mutings => mutings.map(muting => muting.muterId));

		const newMutings: Map<string, { muterId: string; muteeId: string; createdAt: Date; expiresAt: Date | null; }> = new Map();

		// 重複しないようにIDを生成
		const genId = (): string => {
			let id: string;
			do {
				id = this.idService.genId();
			} while (newMutings.has(id));
			return id;
		};
		for (const muting of oldMutings) {
			if (existingMutingsMuterUserIds.includes(muting.muterId)) continue; // skip if already muted indefinitely
			newMutings.set(genId(), {
				...muting,
				createdAt: new Date(),
				muteeId: dst.id,
			});
		}

		const arrayToInsert = Array.from(newMutings.entries()).map(entry => ({ ...entry[1], id: entry[0] }));
		await this.mutingsRepository.insert(arrayToInsert);
	}

	/**
	 * Update lists while moving accounts.
	 *   - No removal of the old account from the lists
	 *   - Users number limit is not checked
	 *
	 * @param src ThinUser (old account)
	 * @param dst User (new account)
	 * @returns Promise<void>
	 */
	@bindThis
	public async updateLists(src: ThinUser, dst: User): Promise<void> {
		// Return if there is no list to be updated.
		const oldJoinings = await this.userListJoiningsRepository.find({
			where: {
				userId: src.id,
			},
		});
		if (oldJoinings.length === 0) return;

		const existingUserListIds = await this.userListJoiningsRepository.find({
			where: {
				userId: dst.id,
			},
		}).then(joinings => joinings.map(joining => joining.userListId));

		const newJoinings: Map<string, { createdAt: Date; userId: string; userListId: string; }> = new Map();

		// 重複しないようにIDを生成
		const genId = (): string => {
			let id: string;
			do {
				id = this.idService.genId();
			} while (newJoinings.has(id));
			return id;
		};
		for (const joining of oldJoinings) {
			if (existingUserListIds.includes(joining.userListId)) continue; // skip if dst exists in this user's list
			newJoinings.set(genId(), {
				createdAt: new Date(),
				userId: dst.id,
				userListId: joining.userListId,
			});
		}

		const arrayToInsert = Array.from(newJoinings.entries()).map(entry => ({ ...entry[1], id: entry[0] }));
		await this.userListJoiningsRepository.insert(arrayToInsert);

		// Have the proxy account follow the new account in the same way as UserListService.push
		if (this.userEntityService.isRemoteUser(dst)) {
			const proxy = await this.proxyAccountService.fetch();
			if (proxy) {
				this.queueService.createFollowJob([{ from: { id: proxy.id }, to: { id: dst.id } }]);
			}
		}
	}

	@bindThis
	private async adjustFollowingCounts(localFollowerIds: string[], oldAccount: User): Promise<void> {
		if (localFollowerIds.length === 0) return;

		// Set the old account's following and followers counts to 0.
		await this.usersRepository.update({ id: oldAccount.id }, { followersCount: 0, followingCount: 0 });

		// Decrease following counts of local followers by 1.
		await this.usersRepository.decrement({ id: In(localFollowerIds) }, 'followingCount', 1);

		// Decrease follower counts of local followees by 1.
		const oldFollowings = await this.followingsRepository.findBy({ followerId: oldAccount.id });
		if (oldFollowings.length > 0) {
			await this.usersRepository.decrement({ id: In(oldFollowings.map(following => following.followeeId)) }, 'followersCount', 1);
		}

		// Update instance stats by decreasing remote followers count by the number of local followers who were following the old account.
		if (this.userEntityService.isRemoteUser(oldAccount)) {
			this.federatedInstanceService.fetch(oldAccount.host).then(async i => {
				this.instancesRepository.decrement({ id: i.id }, 'followersCount', localFollowerIds.length);
				if ((await this.metaService.fetch()).enableChartsForFederatedInstances) {
					this.instanceChart.updateFollowers(i.host, false);
				}
			});
		}

		// FIXME: expensive?
		for (const followerId of localFollowerIds) {
			this.perUserFollowingChart.update({ id: followerId, host: null }, oldAccount, false);
		}
	}
}
