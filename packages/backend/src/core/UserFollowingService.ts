/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { IsNull } from 'typeorm';
import type { MiLocalUser, MiPartialLocalUser, MiPartialRemoteUser, MiRemoteUser, MiUser } from '@/models/User.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { QueueService } from '@/core/QueueService.js';
import PerUserFollowingChart from '@/core/chart/charts/per-user-following.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { IdService } from '@/core/IdService.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import type { Packed } from '@/misc/json-schema.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { WebhookService } from '@/core/WebhookService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { DI } from '@/di-symbols.js';
import type { FollowingsRepository, FollowRequestsRepository, InstancesRepository, UserProfilesRepository, UsersRepository } from '@/models/_.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { bindThis } from '@/decorators.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import { MetaService } from '@/core/MetaService.js';
import { CacheService } from '@/core/CacheService.js';
import type { Config } from '@/config.js';
import { AccountMoveService } from '@/core/AccountMoveService.js';
import { UtilityService } from '@/core/UtilityService.js';
import { FanoutTimelineService } from '@/core/FanoutTimelineService.js';
import Logger from '../logger.js';

const logger = new Logger('following/create');

type Local = MiLocalUser | {
	id: MiLocalUser['id'];
	host: MiLocalUser['host'];
	uri: MiLocalUser['uri']
};
type Remote = MiRemoteUser | {
	id: MiRemoteUser['id'];
	host: MiRemoteUser['host'];
	uri: MiRemoteUser['uri'];
	inbox: MiRemoteUser['inbox'];
};
type Both = Local | Remote;

@Injectable()
export class UserFollowingService implements OnModuleInit {
	private userBlockingService: UserBlockingService;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.config)
		private config: Config,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.followRequestsRepository)
		private followRequestsRepository: FollowRequestsRepository,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private cacheService: CacheService,
		private utilityService: UtilityService,
		private userEntityService: UserEntityService,
		private idService: IdService,
		private queueService: QueueService,
		private globalEventService: GlobalEventService,
		private metaService: MetaService,
		private notificationService: NotificationService,
		private federatedInstanceService: FederatedInstanceService,
		private webhookService: WebhookService,
		private apRendererService: ApRendererService,
		private accountMoveService: AccountMoveService,
		private fanoutTimelineService: FanoutTimelineService,
		private perUserFollowingChart: PerUserFollowingChart,
		private instanceChart: InstanceChart,
	) {
	}

	onModuleInit() {
		this.userBlockingService = this.moduleRef.get('UserBlockingService');
	}

	@bindThis
	public async follow(
		_follower: { id: MiUser['id'] },
		_followee: { id: MiUser['id'] },
		{ requestId, silent = false, withReplies }: {
			requestId?: string,
			silent?: boolean,
			withReplies?: boolean,
		} = {},
	): Promise<void> {
		const [follower, followee] = await Promise.all([
			this.usersRepository.findOneByOrFail({ id: _follower.id }),
			this.usersRepository.findOneByOrFail({ id: _followee.id }),
		]) as [MiLocalUser | MiRemoteUser, MiLocalUser | MiRemoteUser];

		// check blocking
		const [blocking, blocked] = await Promise.all([
			this.userBlockingService.checkBlocked(follower.id, followee.id),
			this.userBlockingService.checkBlocked(followee.id, follower.id),
		]);

		if (this.userEntityService.isRemoteUser(follower) && this.userEntityService.isLocalUser(followee) && blocked) {
			// リモートフォローを受けてブロックしていた場合は、エラーにするのではなくRejectを送り返しておしまい。
			const content = this.apRendererService.addContext(this.apRendererService.renderReject(this.apRendererService.renderFollow(follower, followee, requestId), followee));
			this.queueService.deliver(followee, content, follower.inbox, false);
			return;
		} else if (this.userEntityService.isRemoteUser(follower) && this.userEntityService.isLocalUser(followee) && blocking) {
			// リモートフォローを受けてブロックされているはずの場合だったら、ブロック解除しておく。
			await this.userBlockingService.unblock(follower, followee);
		} else {
			// それ以外は単純に例外
			if (blocking) throw new IdentifiableError('710e8fb0-b8c3-4922-be49-d5d93d8e6a6e', 'blocking');
			if (blocked) throw new IdentifiableError('3338392a-f764-498d-8855-db939dcf8c48', 'blocked');
		}

		const followeeProfile = await this.userProfilesRepository.findOneByOrFail({ userId: followee.id });
		// フォロー対象が鍵アカウントである or
		// フォロワーがBotであり、フォロー対象がBotからのフォローに慎重である or
		// フォロワーがローカルユーザーであり、フォロー対象がリモートユーザーである or
		// フォロワーがローカルユーザーであり、フォロー対象がサイレンスされているサーバーである
		// 上記のいずれかに当てはまる場合はすぐフォローせずにフォローリクエストを発行しておく
		if (
			followee.isLocked ||
			(followeeProfile.carefulBot && follower.isBot) ||
			(this.userEntityService.isLocalUser(follower) && this.userEntityService.isRemoteUser(followee) && process.env.FORCE_FOLLOW_REMOTE_USER_FOR_TESTING !== 'true') ||
			(this.userEntityService.isLocalUser(followee) && this.userEntityService.isRemoteUser(follower) && this.utilityService.isSilencedHost((await this.metaService.fetch()).silencedHosts, follower.host))
		) {
			let autoAccept = false;

			// 鍵アカウントであっても、既にフォローされていた場合はスルー
			const isFollowing = await this.followingsRepository.exists({
				where: {
					followerId: follower.id,
					followeeId: followee.id,
				},
			});
			if (isFollowing) {
				autoAccept = true;
			}

			// フォローしているユーザーは自動承認オプション
			if (!autoAccept && (this.userEntityService.isLocalUser(followee) && followeeProfile.autoAcceptFollowed)) {
				const isFollowed = await this.followingsRepository.exists({
					where: {
						followerId: followee.id,
						followeeId: follower.id,
					},
				});

				if (isFollowed) autoAccept = true;
			}

			// Automatically accept if the follower is an account who has moved and the locked followee had accepted the old account.
			if (followee.isLocked && !autoAccept) {
				autoAccept = !!(await this.accountMoveService.validateAlsoKnownAs(
					follower,
					(oldSrc, newSrc) => this.followingsRepository.exists({
						where: {
							followeeId: followee.id,
							followerId: newSrc.id,
						},
					}),
					true,
				));
			}

			if (!autoAccept) {
				await this.createFollowRequest(follower, followee, requestId, withReplies);
				return;
			}
		}

		await this.insertFollowingDoc(followee, follower, silent, withReplies);

		if (this.userEntityService.isRemoteUser(follower) && this.userEntityService.isLocalUser(followee)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderAccept(this.apRendererService.renderFollow(follower, followee, requestId), followee));
			this.queueService.deliver(followee, content, follower.inbox, false);
		}
	}

	@bindThis
	private async insertFollowingDoc(
		followee: {
			id: MiUser['id']; host: MiUser['host']; uri: MiUser['host']; inbox: MiUser['inbox']; sharedInbox: MiUser['sharedInbox']
		},
		follower: {
			id: MiUser['id']; host: MiUser['host']; uri: MiUser['host']; inbox: MiUser['inbox']; sharedInbox: MiUser['sharedInbox']
		},
		silent = false,
		withReplies?: boolean,
	): Promise<void> {
		if (follower.id === followee.id) return;

		let alreadyFollowed = false as boolean;

		await this.followingsRepository.insert({
			id: this.idService.gen(),
			followerId: follower.id,
			followeeId: followee.id,
			withReplies: withReplies,

			// 非正規化
			followerHost: follower.host,
			followerInbox: this.userEntityService.isRemoteUser(follower) ? follower.inbox : null,
			followerSharedInbox: this.userEntityService.isRemoteUser(follower) ? follower.sharedInbox : null,
			followeeHost: followee.host,
			followeeInbox: this.userEntityService.isRemoteUser(followee) ? followee.inbox : null,
			followeeSharedInbox: this.userEntityService.isRemoteUser(followee) ? followee.sharedInbox : null,
		}).catch(err => {
			if (isDuplicateKeyValueError(err) && this.userEntityService.isRemoteUser(follower) && this.userEntityService.isLocalUser(followee)) {
				logger.info(`Insert duplicated ignore. ${follower.id} => ${followee.id}`);
				alreadyFollowed = true;
			} else {
				throw err;
			}
		});

		this.cacheService.userFollowingsCache.refresh(follower.id);

		const requestExist = await this.followRequestsRepository.exists({
			where: {
				followeeId: followee.id,
				followerId: follower.id,
			},
		});

		if (requestExist) {
			await this.followRequestsRepository.delete({
				followeeId: followee.id,
				followerId: follower.id,
			});

			// 通知を作成
			this.notificationService.createNotification(follower.id, 'followRequestAccepted', {
			}, followee.id);
		}

		if (alreadyFollowed) return;

		this.globalEventService.publishInternalEvent('follow', { followerId: follower.id, followeeId: followee.id });

		const [followeeUser, followerUser] = await Promise.all([
			this.usersRepository.findOneByOrFail({ id: followee.id }),
			this.usersRepository.findOneByOrFail({ id: follower.id }),
		]);

		// Neither followee nor follower has moved.
		if (!followeeUser.movedToUri && !followerUser.movedToUri) {
			//#region Increment counts
			await Promise.all([
				this.usersRepository.increment({ id: follower.id }, 'followingCount', 1),
				this.usersRepository.increment({ id: followee.id }, 'followersCount', 1),
			]);
			//#endregion

			//#region Update instance stats
			if (this.userEntityService.isRemoteUser(follower) && this.userEntityService.isLocalUser(followee)) {
				this.federatedInstanceService.fetch(follower.host).then(async i => {
					this.instancesRepository.increment({ id: i.id }, 'followingCount', 1);
					if ((await this.metaService.fetch()).enableChartsForFederatedInstances) {
						this.instanceChart.updateFollowing(i.host, true);
					}
				});
			} else if (this.userEntityService.isLocalUser(follower) && this.userEntityService.isRemoteUser(followee)) {
				this.federatedInstanceService.fetch(followee.host).then(async i => {
					this.instancesRepository.increment({ id: i.id }, 'followersCount', 1);
					if ((await this.metaService.fetch()).enableChartsForFederatedInstances) {
						this.instanceChart.updateFollowers(i.host, true);
					}
				});
			}
			//#endregion

			this.perUserFollowingChart.update(follower, followee, true);
		}

		if (this.userEntityService.isLocalUser(follower) && !silent) {
			// Publish follow event
			this.userEntityService.pack(followee.id, follower, {
				schema: 'UserDetailedNotMe',
			}).then(async packed => {
				this.globalEventService.publishMainStream(follower.id, 'follow', packed);

				const webhooks = (await this.webhookService.getActiveWebhooks()).filter(x => x.userId === follower.id && x.on.includes('follow'));
				for (const webhook of webhooks) {
					this.queueService.webhookDeliver(webhook, 'follow', {
						user: packed,
					});
				}
			});
		}

		// Publish followed event
		if (this.userEntityService.isLocalUser(followee)) {
			this.userEntityService.pack(follower.id, followee).then(async packed => {
				this.globalEventService.publishMainStream(followee.id, 'followed', packed);

				const webhooks = (await this.webhookService.getActiveWebhooks()).filter(x => x.userId === followee.id && x.on.includes('followed'));
				for (const webhook of webhooks) {
					this.queueService.webhookDeliver(webhook, 'followed', {
						user: packed,
					});
				}
			});

			// 通知を作成
			this.notificationService.createNotification(followee.id, 'follow', {
			}, follower.id);
		}
	}

	@bindThis
	public async unfollow(
		follower: {
			id: MiUser['id']; host: MiUser['host']; uri: MiUser['host']; inbox: MiUser['inbox']; sharedInbox: MiUser['sharedInbox'];
		},
		followee: {
			id: MiUser['id']; host: MiUser['host']; uri: MiUser['host']; inbox: MiUser['inbox']; sharedInbox: MiUser['sharedInbox'];
		},
		silent = false,
	): Promise<void> {
		const following = await this.followingsRepository.findOne({
			relations: {
				follower: true,
				followee: true,
			},
			where: {
				followerId: follower.id,
				followeeId: followee.id,
			},
		});

		if (following === null || !following.follower || !following.followee) {
			logger.warn('フォロー解除がリクエストされましたがフォローしていませんでした');
			return;
		}

		await this.followingsRepository.delete(following.id);

		this.cacheService.userFollowingsCache.refresh(follower.id);

		this.decrementFollowing(following.follower, following.followee);

		if (!silent && this.userEntityService.isLocalUser(follower)) {
			// Publish unfollow event
			this.userEntityService.pack(followee.id, follower, {
				schema: 'UserDetailedNotMe',
			}).then(async packed => {
				this.globalEventService.publishMainStream(follower.id, 'unfollow', packed);

				const webhooks = (await this.webhookService.getActiveWebhooks()).filter(x => x.userId === follower.id && x.on.includes('unfollow'));
				for (const webhook of webhooks) {
					this.queueService.webhookDeliver(webhook, 'unfollow', {
						user: packed,
					});
				}
			});
		}

		if (this.userEntityService.isLocalUser(follower) && this.userEntityService.isRemoteUser(followee)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderUndo(this.apRendererService.renderFollow(follower as MiPartialLocalUser, followee as MiPartialRemoteUser), follower));
			this.queueService.deliver(follower, content, followee.inbox, false);
		}

		if (this.userEntityService.isLocalUser(followee) && this.userEntityService.isRemoteUser(follower)) {
			// local user has null host
			const content = this.apRendererService.addContext(this.apRendererService.renderReject(this.apRendererService.renderFollow(follower as MiPartialRemoteUser, followee as MiPartialLocalUser), followee));
			this.queueService.deliver(followee, content, follower.inbox, false);
		}
	}

	@bindThis
	private async decrementFollowing(
		follower: MiUser,
		followee: MiUser,
	): Promise<void> {
		this.globalEventService.publishInternalEvent('unfollow', { followerId: follower.id, followeeId: followee.id });

		// Neither followee nor follower has moved.
		if (!follower.movedToUri && !followee.movedToUri) {
			//#region Decrement following / followers counts
			await Promise.all([
				this.usersRepository.decrement({ id: follower.id }, 'followingCount', 1),
				this.usersRepository.decrement({ id: followee.id }, 'followersCount', 1),
			]);
			//#endregion

			//#region Update instance stats
			if (this.userEntityService.isRemoteUser(follower) && this.userEntityService.isLocalUser(followee)) {
				this.federatedInstanceService.fetch(follower.host).then(async i => {
					this.instancesRepository.decrement({ id: i.id }, 'followingCount', 1);
					if ((await this.metaService.fetch()).enableChartsForFederatedInstances) {
						this.instanceChart.updateFollowing(i.host, false);
					}
				});
			} else if (this.userEntityService.isLocalUser(follower) && this.userEntityService.isRemoteUser(followee)) {
				this.federatedInstanceService.fetch(followee.host).then(async i => {
					this.instancesRepository.decrement({ id: i.id }, 'followersCount', 1);
					if ((await this.metaService.fetch()).enableChartsForFederatedInstances) {
						this.instanceChart.updateFollowers(i.host, false);
					}
				});
			}
			//#endregion

			this.perUserFollowingChart.update(follower, followee, false);
		} else {
			// Adjust following/followers counts
			for (const user of [follower, followee]) {
				if (user.movedToUri) continue; // No need to update if the user has already moved.

				const nonMovedFollowees = await this.followingsRepository.count({
					relations: {
						followee: true,
					},
					where: {
						followerId: user.id,
						followee: {
							movedToUri: IsNull(),
						},
					},
				});
				const nonMovedFollowers = await this.followingsRepository.count({
					relations: {
						follower: true,
					},
					where: {
						followeeId: user.id,
						follower: {
							movedToUri: IsNull(),
						},
					},
				});
				await this.usersRepository.update(
					{ id: user.id },
					{ followingCount: nonMovedFollowees, followersCount: nonMovedFollowers },
				);
			}

			// TODO: adjust charts
		}
	}

	@bindThis
	public async createFollowRequest(
		follower: {
			id: MiUser['id']; host: MiUser['host']; uri: MiUser['host']; inbox: MiUser['inbox']; sharedInbox: MiUser['sharedInbox'];
		},
		followee: {
			id: MiUser['id']; host: MiUser['host']; uri: MiUser['host']; inbox: MiUser['inbox']; sharedInbox: MiUser['sharedInbox'];
		},
		requestId?: string,
		withReplies?: boolean,
	): Promise<void> {
		if (follower.id === followee.id) return;

		// check blocking
		const [blocking, blocked] = await Promise.all([
			this.userBlockingService.checkBlocked(follower.id, followee.id),
			this.userBlockingService.checkBlocked(followee.id, follower.id),
		]);

		if (blocking) throw new Error('blocking');
		if (blocked) throw new Error('blocked');

		const followRequest = await this.followRequestsRepository.insert({
			id: this.idService.gen(),
			followerId: follower.id,
			followeeId: followee.id,
			requestId,
			withReplies,

			// 非正規化
			followerHost: follower.host,
			followerInbox: this.userEntityService.isRemoteUser(follower) ? follower.inbox : undefined,
			followerSharedInbox: this.userEntityService.isRemoteUser(follower) ? follower.sharedInbox : undefined,
			followeeHost: followee.host,
			followeeInbox: this.userEntityService.isRemoteUser(followee) ? followee.inbox : undefined,
			followeeSharedInbox: this.userEntityService.isRemoteUser(followee) ? followee.sharedInbox : undefined,
		}).then(x => this.followRequestsRepository.findOneByOrFail(x.identifiers[0]));

		// Publish receiveRequest event
		if (this.userEntityService.isLocalUser(followee)) {
			this.userEntityService.pack(follower.id, followee).then(packed => this.globalEventService.publishMainStream(followee.id, 'receiveFollowRequest', packed));

			this.userEntityService.pack(followee.id, followee, {
				schema: 'MeDetailed',
			}).then(packed => this.globalEventService.publishMainStream(followee.id, 'meUpdated', packed));

			// 通知を作成
			this.notificationService.createNotification(followee.id, 'receiveFollowRequest', {
			}, follower.id);
		}

		if (this.userEntityService.isLocalUser(follower) && this.userEntityService.isRemoteUser(followee)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderFollow(follower as MiPartialLocalUser, followee as MiPartialRemoteUser, requestId ?? `${this.config.url}/follows/${followRequest.id}`));
			this.queueService.deliver(follower, content, followee.inbox, false);
		}
	}

	@bindThis
	public async cancelFollowRequest(
		followee: {
			id: MiUser['id']; host: MiUser['host']; uri: MiUser['host']; inbox: MiUser['inbox']
		},
		follower: {
			id: MiUser['id']; host: MiUser['host']; uri: MiUser['host']
		},
	): Promise<void> {
		if (this.userEntityService.isRemoteUser(followee)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderUndo(this.apRendererService.renderFollow(follower as MiPartialLocalUser | MiPartialRemoteUser, followee as MiPartialRemoteUser), follower));

			if (this.userEntityService.isLocalUser(follower)) { // 本来このチェックは不要だけどTSに怒られるので
				this.queueService.deliver(follower, content, followee.inbox, false);
			}
		}

		const requestExist = await this.followRequestsRepository.exists({
			where: {
				followeeId: followee.id,
				followerId: follower.id,
			},
		});

		if (!requestExist) {
			throw new IdentifiableError('17447091-ce07-46dd-b331-c1fd4f15b1e7', 'request not found');
		}

		await this.followRequestsRepository.delete({
			followeeId: followee.id,
			followerId: follower.id,
		});

		this.userEntityService.pack(followee.id, followee, {
			schema: 'MeDetailed',
		}).then(packed => this.globalEventService.publishMainStream(followee.id, 'meUpdated', packed));
	}

	@bindThis
	public async acceptFollowRequest(
		followee: {
			id: MiUser['id']; host: MiUser['host']; uri: MiUser['host']; inbox: MiUser['inbox']; sharedInbox: MiUser['sharedInbox'];
		},
		follower: MiUser,
	): Promise<void> {
		const request = await this.followRequestsRepository.findOneBy({
			followeeId: followee.id,
			followerId: follower.id,
		});

		if (request == null) {
			throw new IdentifiableError('8884c2dd-5795-4ac9-b27e-6a01d38190f9', 'No follow request.');
		}

		await this.insertFollowingDoc(followee, follower, false, request.withReplies);

		if (this.userEntityService.isRemoteUser(follower) && this.userEntityService.isLocalUser(followee)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderAccept(this.apRendererService.renderFollow(follower, followee as MiPartialLocalUser, request.requestId!), followee));
			this.queueService.deliver(followee, content, follower.inbox, false);
		}

		this.userEntityService.pack(followee.id, followee, {
			schema: 'MeDetailed',
		}).then(packed => this.globalEventService.publishMainStream(followee.id, 'meUpdated', packed));
	}

	@bindThis
	public async acceptAllFollowRequests(
		user: {
			id: MiUser['id']; host: MiUser['host']; uri: MiUser['host']; inbox: MiUser['inbox']; sharedInbox: MiUser['sharedInbox'];
		},
	): Promise<void> {
		const requests = await this.followRequestsRepository.findBy({
			followeeId: user.id,
		});

		for (const request of requests) {
			const follower = await this.usersRepository.findOneByOrFail({ id: request.followerId });
			this.acceptFollowRequest(user, follower);
		}
	}

	/**
	 * API following/request/reject
	 */
	@bindThis
	public async rejectFollowRequest(user: Local, follower: Both): Promise<void> {
		if (this.userEntityService.isRemoteUser(follower)) {
			this.deliverReject(user, follower);
		}

		await this.removeFollowRequest(user, follower);

		if (this.userEntityService.isLocalUser(follower)) {
			this.publishUnfollow(user, follower);
		}
	}

	/**
	 * API following/reject
	 */
	@bindThis
	public async rejectFollow(user: Local, follower: Both): Promise<void> {
		if (this.userEntityService.isRemoteUser(follower)) {
			this.deliverReject(user, follower);
		}

		await this.removeFollow(user, follower);

		if (this.userEntityService.isLocalUser(follower)) {
			this.publishUnfollow(user, follower);
		}
	}

	/**
	 * AP Reject/Follow
	 */
	@bindThis
	public async remoteReject(actor: Remote, follower: Local): Promise<void> {
		await this.removeFollowRequest(actor, follower);
		await this.removeFollow(actor, follower);
		this.publishUnfollow(actor, follower);
	}

	/**
	 * Remove follow request record
	 */
	@bindThis
	private async removeFollowRequest(followee: Both, follower: Both): Promise<void> {
		const request = await this.followRequestsRepository.findOneBy({
			followeeId: followee.id,
			followerId: follower.id,
		});

		if (!request) return;

		await this.followRequestsRepository.delete(request.id);
	}

	/**
	 * Remove follow record
	 */
	@bindThis
	private async removeFollow(followee: Both, follower: Both): Promise<void> {
		const following = await this.followingsRepository.findOne({
			relations: {
				followee: true,
				follower: true,
			},
			where: {
				followeeId: followee.id,
				followerId: follower.id,
			},
		});

		if (!following || !following.followee || !following.follower) return;

		await this.followingsRepository.delete(following.id);

		this.decrementFollowing(following.follower, following.followee);
	}

	/**
	 * Deliver Reject to remote
	 */
	@bindThis
	private async deliverReject(followee: Local, follower: Remote): Promise<void> {
		const request = await this.followRequestsRepository.findOneBy({
			followeeId: followee.id,
			followerId: follower.id,
		});

		const content = this.apRendererService.addContext(this.apRendererService.renderReject(this.apRendererService.renderFollow(follower, followee, request?.requestId ?? undefined), followee));
		this.queueService.deliver(followee, content, follower.inbox, false);
	}

	/**
	 * Publish unfollow to local
	 */
	@bindThis
	private async publishUnfollow(followee: Both, follower: Local): Promise<void> {
		const packedFollowee = await this.userEntityService.pack(followee.id, follower, {
			schema: 'UserDetailedNotMe',
		});

		this.globalEventService.publishMainStream(follower.id, 'unfollow', packedFollowee);

		const webhooks = (await this.webhookService.getActiveWebhooks()).filter(x => x.userId === follower.id && x.on.includes('unfollow'));
		for (const webhook of webhooks) {
			this.queueService.webhookDeliver(webhook, 'unfollow', {
				user: packedFollowee,
			});
		}
	}

	@bindThis
	public getFollowees(userId: MiUser['id']) {
		return this.followingsRepository.createQueryBuilder('following')
			.select('following.followeeId')
			.where('following.followerId = :followerId', { followerId: userId })
			.getMany();
	}
}
