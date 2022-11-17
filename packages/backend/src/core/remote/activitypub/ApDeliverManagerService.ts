import { Inject, Injectable } from '@nestjs/common';
import { IsNull, Not } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { FollowingsRepository, UsersRepository } from '@/models/index.js';
import type { Config } from '@/config.js';
import type { ILocalUser, IRemoteUser, User } from '@/models/entities/User.js';
import { QueueService } from '@/core/QueueService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';

interface IRecipe {
	type: string;
}

interface IFollowersRecipe extends IRecipe {
	type: 'Followers';
}

interface IDirectRecipe extends IRecipe {
	type: 'Direct';
	to: IRemoteUser;
}

const isFollowers = (recipe: any): recipe is IFollowersRecipe =>
	recipe.type === 'Followers';

const isDirect = (recipe: any): recipe is IDirectRecipe =>
	recipe.type === 'Direct';

@Injectable()
export class ApDeliverManagerService {
	constructor(
		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userEntityService: UserEntityService,
		private queueService: QueueService,
	) {
	}

	/**
	 * Deliver activity to followers
	 * @param activity Activity
	 * @param from Followee
	 */
	public async deliverToFollowers(actor: { id: ILocalUser['id']; host: null; }, activity: any) {
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
	 * @param activity Activity
	 * @param to Target user
	 */
	public async deliverToUser(actor: { id: ILocalUser['id']; host: null; }, activity: any, to: IRemoteUser) {
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

	public createDeliverManager(actor: { id: User['id']; host: null; }, activity: any) {
		return new DeliverManager(
			this.userEntityService,
			this.followingsRepository,
			this.queueService,

			actor, 
			activity,
		);
	}
}

class DeliverManager {
	private actor: { id: User['id']; host: null; };
	private activity: any;
	private recipes: IRecipe[] = [];

	/**
	 * Constructor
	 * @param actor Actor
	 * @param activity Activity to deliver
	 */
	constructor(
		private userEntityService: UserEntityService,
		private followingsRepository: FollowingsRepository,
		private queueService: QueueService,

		actor: { id: User['id']; host: null; },
		activity: any,
	) {
		this.actor = actor;
		this.activity = activity;
	}

	/**
	 * Add recipe for followers deliver
	 */
	public addFollowersRecipe() {
		const deliver = {
			type: 'Followers',
		} as IFollowersRecipe;

		this.addRecipe(deliver);
	}

	/**
	 * Add recipe for direct deliver
	 * @param to To
	 */
	public addDirectRecipe(to: IRemoteUser) {
		const recipe = {
			type: 'Direct',
			to,
		} as IDirectRecipe;

		this.addRecipe(recipe);
	}

	/**
	 * Add recipe
	 * @param recipe Recipe
	 */
	public addRecipe(recipe: IRecipe) {
		this.recipes.push(recipe);
	}

	/**
	 * Execute delivers
	 */
	public async execute() {
		if (!this.userEntityService.isLocalUser(this.actor)) return;

		const inboxes = new Set<string>();

		/*
		build inbox list

		Process follower recipes first to avoid duplication when processing
		direct recipes later.
		*/
		if (this.recipes.some(r => isFollowers(r))) {
			// followers deliver
			// TODO: SELECT DISTINCT ON ("followerSharedInbox") "followerSharedInbox" みたいな問い合わせにすればよりパフォーマンス向上できそう
			// ただ、sharedInboxがnullなリモートユーザーも稀におり、その対応ができなさそう？
			const followers = await this.followingsRepository.find({
				where: {
					followeeId: this.actor.id,
					followerHost: Not(IsNull()),
				},
				select: {
					followerSharedInbox: true,
					followerInbox: true,
				},
			}) as {
				followerSharedInbox: string | null;
				followerInbox: string;
			}[];

			for (const following of followers) {
				const inbox = following.followerSharedInbox ?? following.followerInbox;
				inboxes.add(inbox);
			}
		}

		this.recipes.filter((recipe): recipe is IDirectRecipe =>
			// followers recipes have already been processed
			isDirect(recipe)
			// check that shared inbox has not been added yet
			&& !(recipe.to.sharedInbox && inboxes.has(recipe.to.sharedInbox))
			// check that they actually have an inbox
			&& recipe.to.inbox != null,
		)
			.forEach(recipe => inboxes.add(recipe.to.inbox!));

		// deliver
		for (const inbox of inboxes) {
			this.queueService.deliver(this.actor, this.activity, inbox);
		}
	}
}
