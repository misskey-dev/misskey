/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull, Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { FollowingsRepository } from '@/models/_.js';
import type { MiLocalUser, MiRemoteUser, MiUser } from '@/models/User.js';
import { QueueService } from '@/core/QueueService.js';
import { bindThis } from '@/decorators.js';
import type { IActivity } from '@/core/activitypub/type.js';
import { ThinUser } from '@/queue/types.js';
import { AccountUpdateService } from '@/core/AccountUpdateService.js';
import type Logger from '@/logger.js';
import { ApLoggerService } from './ApLoggerService.js';

interface IRecipe {
	type: string;
}

interface IFollowersRecipe extends IRecipe {
	type: 'Followers';
}

interface IDirectRecipe extends IRecipe {
	type: 'Direct';
	to: MiRemoteUser;
}

interface IAllKnowingSharedInboxRecipe extends IRecipe {
	type: 'AllKnowingSharedInbox';
}

const isFollowers = (recipe: IRecipe): recipe is IFollowersRecipe =>
	recipe.type === 'Followers';

const isDirect = (recipe: IRecipe): recipe is IDirectRecipe =>
	recipe.type === 'Direct';

const isAllKnowingSharedInbox = (recipe: IRecipe): recipe is IAllKnowingSharedInboxRecipe =>
	recipe.type === 'AllKnowingSharedInbox';

class DeliverManager {
	private actor: ThinUser;
	private activity: IActivity | null;
	private recipes: IRecipe[] = [];

	/**
	 * Constructor
	 * @param followingsRepository
	 * @param queueService
	 * @param actor Actor
	 * @param activity Activity to deliver
	 */
	constructor(
		private followingsRepository: FollowingsRepository,
		private queueService: QueueService,
		private logger: Logger,

		actor: { id: MiUser['id']; host: null; },
		activity: IActivity | null,
	) {
		// 型で弾いてはいるが一応ローカルユーザーかチェック
		// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
		if (actor.host != null) throw new Error('actor.host must be null');

		// パフォーマンス向上のためキューに突っ込むのはidのみに絞る
		this.actor = {
			id: actor.id,
		};
		this.activity = activity;
	}

	/**
	 * Add recipe for followers deliver
	 */
	@bindThis
	public addFollowersRecipe(): void {
		const deliver: IFollowersRecipe = {
			type: 'Followers',
		};

		this.addRecipe(deliver);
	}

	/**
	 * Add recipe for direct deliver
	 * @param to To
	 */
	@bindThis
	public addDirectRecipe(to: MiRemoteUser): void {
		const recipe: IDirectRecipe = {
			type: 'Direct',
			to,
		};

		this.addRecipe(recipe);
	}

	/**
	 * Add recipe for all-knowing shared inbox deliver
	 */
	@bindThis
	public addAllKnowingSharedInboxRecipe(): void {
		const deliver: IAllKnowingSharedInboxRecipe = {
			type: 'AllKnowingSharedInbox',
		};

		this.addRecipe(deliver);
	}

	/**
	 * Add recipe
	 * @param recipe Recipe
	 */
	@bindThis
	public addRecipe(recipe: IRecipe): void {
		this.recipes.push(recipe);
	}

	/**
	 * Execute delivers
	 */
	@bindThis
	public async execute(opts: { ignoreSuspend?: boolean } = {}): Promise<void> {
		//#region collect inboxes by recipes
		// The value flags whether it is shared or not.
		// key: inbox URL, value: whether it is sharedInbox
		const inboxes = new Map<string, boolean>();

		if (this.recipes.some(r => isAllKnowingSharedInbox(r))) {
			// all-knowing shared inbox
			const followings = await this.followingsRepository.createQueryBuilder('f')
				.select([
					'f.followerSharedInbox',
					'f.followeeSharedInbox',
				])
				.where('f.followerSharedInbox IS NOT NULL')
				.orWhere('f.followeeSharedInbox IS NOT NULL')
				.distinct()
				.getRawMany<{ f_followerSharedInbox: string | null; f_followeeSharedInbox: string | null; }>();

			for (const following of followings) {
				if (following.f_followeeSharedInbox) inboxes.set(following.f_followeeSharedInbox, true);
				if (following.f_followerSharedInbox) inboxes.set(following.f_followerSharedInbox, true);
			}
		}

		// build inbox list
		// Process follower recipes first to avoid duplication when processing direct recipes later.
		if (this.recipes.some(r => isFollowers(r))) {
			// followers deliver
			// TODO: SELECT DISTINCT ON ("followerSharedInbox") "followerSharedInbox" みたいな問い合わせにすればよりパフォーマンス向上できそう
			// ただ、sharedInboxがnullなリモートユーザーも稀におり、その対応ができなさそう？
			const followers = await this.followingsRepository.find({
				where: {
					followeeId: this.actor.id,
					followerHost: Not(IsNull()),
					isFollowerSuspended: opts.ignoreSuspend ? undefined : false,
				},
				select: {
					followerSharedInbox: true,
					followerInbox: true,
				},
			});

			for (const following of followers) {
				const inbox = following.followerSharedInbox ?? following.followerInbox;
				if (inbox === null) throw new Error('inbox is null');
				inboxes.set(inbox, following.followerSharedInbox != null);
			}
		}

		for (const recipe of this.recipes.filter(isDirect)) {
			// check that shared inbox has not been added yet
			if (recipe.to.sharedInbox !== null && inboxes.has(recipe.to.sharedInbox)) continue;

			// check that they actually have an inbox
			if (recipe.to.inbox === null) continue;

			inboxes.set(recipe.to.inbox, false);
		}
		//#endregion

		// deliver
		await this.queueService.deliverMany(this.actor, this.activity, inboxes);
		this.logger.info(`Deliver queues dispatched: inboxes=${inboxes.size} actorId=${this.actor.id} activityId=${this.activity?.id}`);
	}
}

@Injectable()
export class ApDeliverManagerService {
	private logger: Logger;

	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private queueService: QueueService,
		private apLoggerService: ApLoggerService,
	) {
		this.logger = this.apLoggerService.logger.createSubLogger('deliver-manager');
	}

	/**
	 * Deliver activity to followers
	 * @param actor
	 * @param activity Activity
	 */
	@bindThis
	public async deliverToFollowers(actor: { id: MiLocalUser['id']; host: null; }, activity: IActivity): Promise<void> {
		const manager = new DeliverManager(
			this.followingsRepository,
			this.queueService,
			this.logger,
			actor,
			activity,
		);
		manager.addFollowersRecipe();
		await manager.execute();
	}

	/**
	 * Deliver activity to user
	 * @param actor
	 * @param activity Activity
	 * @param to Target user
	 */
	@bindThis
	public async deliverToUser(actor: { id: MiLocalUser['id']; host: null; }, activity: IActivity, to: MiRemoteUser): Promise<void> {
		const manager = new DeliverManager(
			this.followingsRepository,
			this.queueService,
			this.logger,
			actor,
			activity,
		);
		manager.addDirectRecipe(to);
		await manager.execute();
	}

	/**
	 * Deliver activity to users
	 * @param actor
	 * @param activity Activity
	 * @param targets Target users
	 */
	@bindThis
	public async deliverToUsers(actor: { id: MiLocalUser['id']; host: null; }, activity: IActivity, targets: MiRemoteUser[]): Promise<void> {
		const manager = new DeliverManager(
			this.followingsRepository,
			this.queueService,
			this.logger,
			actor,
			activity,
		);
		for (const to of targets) manager.addDirectRecipe(to);
		await manager.execute();
	}

	@bindThis
	public createDeliverManager(actor: { id: MiUser['id']; host: null; }, activity: IActivity | null): DeliverManager {
		return new DeliverManager(
			this.followingsRepository,
			this.queueService,
			this.logger,
			actor,
			activity,
		);
	}
}
