import { Inject, Injectable } from '@nestjs/common';
import type { LocalUser, RemoteUser, User } from '@/models/entities/User.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { QueueService } from '@/core/QueueService.js';
import PerUserFollowingChart from '@/core/chart/charts/per-user-following.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { IdService } from '@/core/IdService.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import type { Packed } from '@/misc/schema.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import { FederatedInstanceService } from '@/core/FederatedInstanceService.js';
import { WebhookService } from '@/core/WebhookService.js';
import { CreateNotificationService } from '@/core/CreateNotificationService.js';
import { DI } from '@/di-symbols.js';
import type { FollowingsRepository, FollowRequestsRepository, InstancesRepository, UserProfilesRepository, UsersRepository } from '@/models/index.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ApRendererService } from '@/core/activitypub/ApRendererService.js';
import { bindThis } from '@/decorators.js';
import { UserBlockingService } from '@/core/UserBlockingService.js';
import Logger from '../logger.js';

const logger = new Logger('following/create');

type Local = LocalUser | {
	id: LocalUser['id'];
	host: LocalUser['host'];
	uri: LocalUser['uri']
};
type Remote = RemoteUser | {
	id: RemoteUser['id'];
	host: RemoteUser['host'];
	uri: RemoteUser['uri'];
	inbox: RemoteUser['inbox'];
};
type Both = Local | Remote;

@Injectable()
export class UserFollowingService {
	constructor(
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

		private userEntityService: UserEntityService,
		private userBlockingService: UserBlockingService,
		private idService: IdService,
		private queueService: QueueService,
		private globalEventService: GlobalEventService,
		private createNotificationService: CreateNotificationService,
		private federatedInstanceService: FederatedInstanceService,
		private webhookService: WebhookService,
		private apRendererService: ApRendererService,
		private perUserFollowingChart: PerUserFollowingChart,
		private instanceChart: InstanceChart,
	) {
	}

	@bindThis
	public async follow(_follower: { id: User['id'] }, _followee: { id: User['id'] }, requestId?: string): Promise<void> {
		const [follower, followee] = await Promise.all([
			this.usersRepository.findOneByOrFail({ id: _follower.id }),
			this.usersRepository.findOneByOrFail({ id: _followee.id }),
		]);

		// check blocking
		const [blocking, blocked] = await Promise.all([
			this.userBlockingService.checkBlocked(follower.id, followee.id),
			this.userBlockingService.checkBlocked(followee.id, follower.id),
		]);

		if (this.userEntityService.isRemoteUser(follower) && this.userEntityService.isLocalUser(followee) && blocked) {
			// リモートフォローを受けてブロックしていた場合は、エラーにするのではなくRejectを送り返しておしまい。
			const content = this.apRendererService.addContext(this.apRendererService.renderReject(this.apRendererService.renderFollow(follower, followee, requestId), followee));
			this.queueService.deliver(followee, content, follower.inbox);
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
		// フォロワーがローカルユーザーであり、フォロー対象がリモートユーザーである
		// 上記のいずれかに当てはまる場合はすぐフォローせずにフォローリクエストを発行しておく
		if (followee.isLocked || (followeeProfile.carefulBot && follower.isBot) || (this.userEntityService.isLocalUser(follower) && this.userEntityService.isRemoteUser(followee))) {
			let autoAccept = false;

			// 鍵アカウントであっても、既にフォローされていた場合はスルー
			const following = await this.followingsRepository.findOneBy({
				followerId: follower.id,
				followeeId: followee.id,
			});
			if (following) {
				autoAccept = true;
			}

			// フォローしているユーザーは自動承認オプション
			if (!autoAccept && (this.userEntityService.isLocalUser(followee) && followeeProfile.autoAcceptFollowed)) {
				const followed = await this.followingsRepository.findOneBy({
					followerId: followee.id,
					followeeId: follower.id,
				});

				if (followed) autoAccept = true;
			}

			if (!autoAccept) {
				await this.createFollowRequest(follower, followee, requestId);
				return;
			}
		}

		await this.insertFollowingDoc(followee, follower);

		if (this.userEntityService.isRemoteUser(follower) && this.userEntityService.isLocalUser(followee)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderAccept(this.apRendererService.renderFollow(follower, followee, requestId), followee));
			this.queueService.deliver(followee, content, follower.inbox);
		}
	}

	@bindThis
	private async insertFollowingDoc(
		followee: {
			id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox']
		},
		follower: {
			id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox']
		},
	): Promise<void> {
		if (follower.id === followee.id) return;
	
		let alreadyFollowed = false as boolean;
	
		await this.followingsRepository.insert({
			id: this.idService.genId(),
			createdAt: new Date(),
			followerId: follower.id,
			followeeId: followee.id,
	
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
	
		const req = await this.followRequestsRepository.findOneBy({
			followeeId: followee.id,
			followerId: follower.id,
		});
	
		if (req) {
			await this.followRequestsRepository.delete({
				followeeId: followee.id,
				followerId: follower.id,
			});
	
			// 通知を作成
			this.createNotificationService.createNotification(follower.id, 'followRequestAccepted', {
				notifierId: followee.id,
			});
		}
	
		if (alreadyFollowed) return;

		this.globalEventService.publishInternalEvent('follow', { followerId: follower.id, followeeId: followee.id });
	
		//#region Increment counts
		await Promise.all([
			this.usersRepository.increment({ id: follower.id }, 'followingCount', 1),
			this.usersRepository.increment({ id: followee.id }, 'followersCount', 1),
		]);
		//#endregion
	
		//#region Update instance stats
		if (this.userEntityService.isRemoteUser(follower) && this.userEntityService.isLocalUser(followee)) {
			this.federatedInstanceService.fetch(follower.host).then(i => {
				this.instancesRepository.increment({ id: i.id }, 'followingCount', 1);
				this.instanceChart.updateFollowing(i.host, true);
			});
		} else if (this.userEntityService.isLocalUser(follower) && this.userEntityService.isRemoteUser(followee)) {
			this.federatedInstanceService.fetch(followee.host).then(i => {
				this.instancesRepository.increment({ id: i.id }, 'followersCount', 1);
				this.instanceChart.updateFollowers(i.host, true);
			});
		}
		//#endregion
	
		this.perUserFollowingChart.update(follower, followee, true);
	
		// Publish follow event
		if (this.userEntityService.isLocalUser(follower)) {
			this.userEntityService.pack(followee.id, follower, {
				detail: true,
			}).then(async packed => {
				this.globalEventService.publishUserEvent(follower.id, 'follow', packed as Packed<'UserDetailedNotMe'>);
				this.globalEventService.publishMainStream(follower.id, 'follow', packed as Packed<'UserDetailedNotMe'>);
	
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
			this.createNotificationService.createNotification(followee.id, 'follow', {
				notifierId: follower.id,
			});
		}
	}

	@bindThis
	public async unfollow(
		follower: {
			id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox'];
		},
		followee: {
			id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox'];
		},
		silent = false,
	): Promise<void> {
		const following = await this.followingsRepository.findOneBy({
			followerId: follower.id,
			followeeId: followee.id,
		});
	
		if (following == null) {
			logger.warn('フォロー解除がリクエストされましたがフォローしていませんでした');
			return;
		}
	
		await this.followingsRepository.delete(following.id);
	
		this.decrementFollowing(follower, followee);
	
		// Publish unfollow event
		if (!silent && this.userEntityService.isLocalUser(follower)) {
			this.userEntityService.pack(followee.id, follower, {
				detail: true,
			}).then(async packed => {
				this.globalEventService.publishUserEvent(follower.id, 'unfollow', packed);
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
			const content = this.apRendererService.addContext(this.apRendererService.renderUndo(this.apRendererService.renderFollow(follower, followee), follower));
			this.queueService.deliver(follower, content, followee.inbox);
		}
	
		if (this.userEntityService.isLocalUser(followee) && this.userEntityService.isRemoteUser(follower)) {
			// local user has null host
			const content = this.apRendererService.addContext(this.apRendererService.renderReject(this.apRendererService.renderFollow(follower, followee), followee));
			this.queueService.deliver(followee, content, follower.inbox);
		}
	}
	
	@bindThis
	private async decrementFollowing(
		follower: {id: User['id']; host: User['host']; },
		followee: { id: User['id']; host: User['host']; },
	): Promise<void> {
		this.globalEventService.publishInternalEvent('unfollow', { followerId: follower.id, followeeId: followee.id });
	
		//#region Decrement following / followers counts
		await Promise.all([
			this.usersRepository.decrement({ id: follower.id }, 'followingCount', 1),
			this.usersRepository.decrement({ id: followee.id }, 'followersCount', 1),
		]);
		//#endregion
	
		//#region Update instance stats
		if (this.userEntityService.isRemoteUser(follower) && this.userEntityService.isLocalUser(followee)) {
			this.federatedInstanceService.fetch(follower.host).then(i => {
				this.instancesRepository.decrement({ id: i.id }, 'followingCount', 1);
				this.instanceChart.updateFollowing(i.host, false);
			});
		} else if (this.userEntityService.isLocalUser(follower) && this.userEntityService.isRemoteUser(followee)) {
			this.federatedInstanceService.fetch(followee.host).then(i => {
				this.instancesRepository.decrement({ id: i.id }, 'followersCount', 1);
				this.instanceChart.updateFollowers(i.host, false);
			});
		}
		//#endregion
	
		this.perUserFollowingChart.update(follower, followee, false);
	}

	@bindThis
	public async createFollowRequest(
		follower: {
			id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox'];
		},
		followee: {
			id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox'];
		},
		requestId?: string,
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
			id: this.idService.genId(),
			createdAt: new Date(),
			followerId: follower.id,
			followeeId: followee.id,
			requestId,
	
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
				detail: true,
			}).then(packed => this.globalEventService.publishMainStream(followee.id, 'meUpdated', packed));
	
			// 通知を作成
			this.createNotificationService.createNotification(followee.id, 'receiveFollowRequest', {
				notifierId: follower.id,
				followRequestId: followRequest.id,
			});
		}
	
		if (this.userEntityService.isLocalUser(follower) && this.userEntityService.isRemoteUser(followee)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderFollow(follower, followee));
			this.queueService.deliver(follower, content, followee.inbox);
		}
	}

	@bindThis
	public async cancelFollowRequest(
		followee: {
			id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']
		},
		follower: {
			id: User['id']; host: User['host']; uri: User['host']
		},
	): Promise<void> {
		if (this.userEntityService.isRemoteUser(followee)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderUndo(this.apRendererService.renderFollow(follower, followee), follower));
	
			if (this.userEntityService.isLocalUser(follower)) { // 本来このチェックは不要だけどTSに怒られるので
				this.queueService.deliver(follower, content, followee.inbox);
			}
		}
	
		const request = await this.followRequestsRepository.findOneBy({
			followeeId: followee.id,
			followerId: follower.id,
		});
	
		if (request == null) {
			throw new IdentifiableError('17447091-ce07-46dd-b331-c1fd4f15b1e7', 'request not found');
		}
	
		await this.followRequestsRepository.delete({
			followeeId: followee.id,
			followerId: follower.id,
		});
	
		this.userEntityService.pack(followee.id, followee, {
			detail: true,
		}).then(packed => this.globalEventService.publishMainStream(followee.id, 'meUpdated', packed));
	}

	@bindThis
	public async acceptFollowRequest(
		followee: {
			id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox'];
		},
		follower: User,
	): Promise<void> {
		const request = await this.followRequestsRepository.findOneBy({
			followeeId: followee.id,
			followerId: follower.id,
		});
	
		if (request == null) {
			throw new IdentifiableError('8884c2dd-5795-4ac9-b27e-6a01d38190f9', 'No follow request.');
		}
	
		await this.insertFollowingDoc(followee, follower);
	
		if (this.userEntityService.isRemoteUser(follower) && this.userEntityService.isLocalUser(followee)) {
			const content = this.apRendererService.addContext(this.apRendererService.renderAccept(this.apRendererService.renderFollow(follower, followee, request.requestId!), followee));
			this.queueService.deliver(followee, content, follower.inbox);
		}
	
		this.userEntityService.pack(followee.id, followee, {
			detail: true,
		}).then(packed => this.globalEventService.publishMainStream(followee.id, 'meUpdated', packed));
	}

	@bindThis
	public async acceptAllFollowRequests(
		user: {
			id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox'];
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
		const following = await this.followingsRepository.findOneBy({
			followeeId: followee.id,
			followerId: follower.id,
		});

		if (!following) return;

		await this.followingsRepository.delete(following.id);
		this.decrementFollowing(follower, followee);
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
		this.queueService.deliver(followee, content, follower.inbox);
	}

	/**
	 * Publish unfollow to local
	 */
	@bindThis
	private async publishUnfollow(followee: Both, follower: Local): Promise<void> {
		const packedFollowee = await this.userEntityService.pack(followee.id, follower, {
			detail: true,
		});

		this.globalEventService.publishUserEvent(follower.id, 'unfollow', packedFollowee);
		this.globalEventService.publishMainStream(follower.id, 'unfollow', packedFollowee);

		const webhooks = (await this.webhookService.getActiveWebhooks()).filter(x => x.userId === follower.id && x.on.includes('unfollow'));
		for (const webhook of webhooks) {
			this.queueService.webhookDeliver(webhook, 'unfollow', {
				user: packedFollowee,
			});
		}
	}
}
