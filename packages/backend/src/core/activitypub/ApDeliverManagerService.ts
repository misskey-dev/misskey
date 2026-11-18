/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { FollowingsRepository } from '@/models/_.js';
import type { MiLocalUser, MiRemoteUser, MiUser } from '@/models/User.js';
import { QueueService } from '@/core/QueueService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import type { IActivity } from '@/core/activitypub/type.js';
import { ThinUser } from '@/queue/types.js';

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

const isFollowers = (recipe: IRecipe): recipe is IFollowersRecipe =>
	recipe.type === 'Followers';

const isDirect = (recipe: IRecipe): recipe is IDirectRecipe =>
	recipe.type === 'Direct';

class DeliverManager {
	private actor: ThinUser;
	private activity: IActivity | null;
	private recipes: IRecipe[] = [];

	/**
	 * Constructor
	 * @param userEntityService
	 * @param followingsRepository
	 * @param queueService
	 * @param actor Actor
	 * @param activity Activity to deliver
	 */
	constructor(
		private userEntityService: UserEntityService,
		private followingsRepository: FollowingsRepository,
		private queueService: QueueService,

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
	public async execute(): Promise<void> {
		// The value flags whether it is shared or not.
		// key: inbox URL, value: whether it is sharedInbox
		const inboxes = new Map<string, boolean>();

		// build inbox list
		// Process follower recipes first to avoid duplication when processing direct recipes later.
		if (this.recipes.some(r => isFollowers(r))) {
			// followers deliver
			// リモートフォロワーの数に比べて配送先 inbox の数はずっと少ないため、重複除去は DB 側で行う。
			// sharedInbox を持たないリモートユーザーは個別の inbox に配送する。
			// 同じ URL が、あるフォロワーでは sharedInbox、別のフォロワーでは個別の inbox として記録されていることがある。
			// 結果が行の順序に左右されないよう inbox ごとにまとめ、1 件でも sharedInbox として記録されていれば sharedInbox として扱う
			const followerInboxes = await this.followingsRepository.createQueryBuilder('following')
				.select('COALESCE(following.followerSharedInbox, following.followerInbox)', 'inbox')
				.addSelect('BOOL_OR(following.followerSharedInbox IS NOT NULL)', 'isSharedInbox')
				.where('following.followeeId = :followeeId', { followeeId: this.actor.id })
				.andWhere('following.followerHost IS NOT NULL')
				// inbox を持たないフォロワーには配送できないので除外する
				.andWhere('(following.followerSharedInbox IS NOT NULL OR following.followerInbox IS NOT NULL)')
				.groupBy('COALESCE(following.followerSharedInbox, following.followerInbox)')
				.getRawMany<{ inbox: string; isSharedInbox: boolean; }>();

			for (const { inbox, isSharedInbox } of followerInboxes) {
				inboxes.set(inbox, isSharedInbox);
			}
		}

		for (const recipe of this.recipes.filter(isDirect)) {
			// check that shared inbox has not been added yet
			if (recipe.to.sharedInbox !== null && inboxes.has(recipe.to.sharedInbox)) continue;

			// check that they actually have an inbox
			if (recipe.to.inbox === null) continue;

			inboxes.set(recipe.to.inbox, false);
		}

		// deliver
		await this.queueService.deliverMany(this.actor, this.activity, inboxes);
	}
}

@Injectable()
export class ApDeliverManagerService {
	constructor(
		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
		private queueService: QueueService,
	) {
	}

	/**
	 * Deliver activity to followers
	 * @param actor
	 * @param activity Activity
	 */
	@bindThis
	public async deliverToFollowers(actor: { id: MiLocalUser['id']; host: null; }, activity: IActivity): Promise<void> {
		const manager = new DeliverManager(
			this.userEntityService,
			this.followingsRepository,
			this.queueService,
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
			this.userEntityService,
			this.followingsRepository,
			this.queueService,
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
			this.userEntityService,
			this.followingsRepository,
			this.queueService,
			actor,
			activity,
		);
		for (const to of targets) manager.addDirectRecipe(to);
		await manager.execute();
	}

	/**
	 * Deliver activity to all known shared inboxes
	 * (shared inboxes of remote users that have a follow relationship with any local user)
	 * @param actor
	 * @param activity Activity
	 */
	@bindThis
	public async deliverToAllKnownSharedInboxes(actor: { id: MiLocalUser['id']; host: null; }, activity: IActivity): Promise<void> {
		// following はサーバー全体で非常に大きくなりうる一方、sharedInbox の種類は高々リモートサーバーの数なので、
		// 重複除去は DB 側で行い、アプリ側には一意な sharedInbox だけを取り出す。
		const sharedInboxes = await this.followingsRepository.createQueryBuilder('following')
			.select('COALESCE(following.followerSharedInbox, following.followeeSharedInbox)', 'inbox')
			.distinct(true)
			.where('following.followerSharedInbox IS NOT NULL')
			.orWhere('following.followeeSharedInbox IS NOT NULL')
			.getRawMany<{ inbox: string; }>();

		if (sharedInboxes.length === 0) return;

		const inboxes = new Map(sharedInboxes.map(({ inbox }) => [inbox, true]));

		await this.queueService.deliverMany({ id: actor.id }, activity, inboxes);
	}

	@bindThis
	public createDeliverManager(actor: { id: MiUser['id']; host: null; }, activity: IActivity | null): DeliverManager {
		return new DeliverManager(
			this.userEntityService,
			this.followingsRepository,
			this.queueService,

			actor,
			activity,
		);
	}
}
