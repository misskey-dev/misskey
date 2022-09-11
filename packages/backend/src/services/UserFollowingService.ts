import { Inject, Injectable } from '@nestjs/common';
import type { Users , Blockings, Followings, UserProfiles , FollowRequests, Instances } from '@/models/index.js';

import type { User } from '@/models/entities/user';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderFollow from '@/remote/activitypub/renderer/follow.js';
import renderAccept from '@/remote/activitypub/renderer/accept.js';
import renderReject from '@/remote/activitypub/renderer/reject.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import type { QueueService } from '@/queue/queue.service.js';
import type PerUserFollowingChart from '@/services/chart/charts/per-user-following.js';
import type { GlobalEventService } from '@/services/GlobalEventService.js';
import { genId } from '@/misc/gen-id.js';
import { isDuplicateKeyValueError } from '@/misc/is-duplicate-key-value-error.js';
import renderUndo from '@/remote/activitypub/renderer/undo.js';
import type { Packed } from '@/misc/schema.js';
import type InstanceChart from '@/services/chart/charts/instance.js';
import type { FederatedInstanceService } from '@/services/FederatedInstanceService.js';
import type { WebhookService } from '@/services/webhookService.js';
import Logger from './logger.js';

const logger = new Logger('following/create');

@Injectable()
export class UserFollowingService {
	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('userProfilesRepository')
		private userProfilesRepository: typeof UserProfiles,

		@Inject('followingsRepository')
		private followingsRepository: typeof Followings,

		@Inject('followRequestsRepository')
		private followRequestsRepository: typeof FollowRequests,

		@Inject('blockingRepository')
		private blockingRepository: typeof Blockings,

		@Inject('instancesRepository')
		private instancesRepository: typeof Instances,

		private queueService: QueueService,
		private globalEventServie: GlobalEventService,
		private federatedInstanceService: FederatedInstanceService,
		private webhookService: WebhookService,
		private perUserFollowingChart: PerUserFollowingChart,
		private instanceChart: InstanceChart,
	) {
	}

	public async follow(_follower: { id: User['id'] }, _followee: { id: User['id'] }, requestId?: string) {
		const [follower, followee] = await Promise.all([
			this.usersRepository.findOneByOrFail({ id: _follower.id }),
			this.usersRepository.findOneByOrFail({ id: _followee.id }),
		]);

		// check blocking
		const [blocking, blocked] = await Promise.all([
			this.blockingRepository.findOneBy({
				blockerId: follower.id,
				blockeeId: followee.id,
			}),
			this.blockingRepository.findOneBy({
				blockerId: followee.id,
				blockeeId: follower.id,
			}),
		]);

		if (this.usersRepository.isRemoteUser(follower) && this.usersRepository.isLocalUser(followee) && blocked) {
		// リモートフォローを受けてブロックしていた場合は、エラーにするのではなくRejectを送り返しておしまい。
			const content = renderActivity(renderReject(renderFollow(follower, followee, requestId), followee));
			this.queueService.deliver(followee , content, follower.inbox);
			return;
		} else if (this.usersRepository.isRemoteUser(follower) && this.usersRepository.isLocalUser(followee) && blocking) {
		// リモートフォローを受けてブロックされているはずの場合だったら、ブロック解除しておく。
			await this.blockingRepository.delete(blocking.id);
		} else {
		// それ以外は単純に例外
			if (blocking != null) throw new IdentifiableError('710e8fb0-b8c3-4922-be49-d5d93d8e6a6e', 'blocking');
			if (blocked != null) throw new IdentifiableError('3338392a-f764-498d-8855-db939dcf8c48', 'blocked');
		}

		const followeeProfile = await this.userProfilesRepository.findOneByOrFail({ userId: followee.id });

		// フォロー対象が鍵アカウントである or
		// フォロワーがBotであり、フォロー対象がBotからのフォローに慎重である or
		// フォロワーがローカルユーザーであり、フォロー対象がリモートユーザーである
		// 上記のいずれかに当てはまる場合はすぐフォローせずにフォローリクエストを発行しておく
		if (followee.isLocked || (followeeProfile.carefulBot && follower.isBot) || (this.usersRepository.isLocalUser(follower) && this.usersRepository.isRemoteUser(followee))) {
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
			if (!autoAccept && (this.usersRepository.isLocalUser(followee) && followeeProfile.autoAcceptFollowed)) {
				const followed = await this.followingsRepository.findOneBy({
					followerId: followee.id,
					followeeId: follower.id,
				});

				if (followed) autoAccept = true;
			}

			if (!autoAccept) {
				await createFollowRequest(follower, followee, requestId);
				return;
			}
		}

		await this.insertFollowingDoc(followee, follower);

		if (this.usersRepository.isRemoteUser(follower) && this.usersRepository.isLocalUser(followee)) {
			const content = renderActivity(renderAccept(renderFollow(follower, followee, requestId), followee));
			this.queueService.deliver(followee, content, follower.inbox);
		}
	}

	public async insertFollowingDoc(followee: { id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox'] }, follower: { id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox'] }) {
		if (follower.id === followee.id) return;
	
		let alreadyFollowed = false;
	
		await this.followingsRepository.insert({
			id: genId(),
			createdAt: new Date(),
			followerId: follower.id,
			followeeId: followee.id,
	
			// 非正規化
			followerHost: follower.host,
			followerInbox: this.usersRepository.isRemoteUser(follower) ? follower.inbox : null,
			followerSharedInbox: this.usersRepository.isRemoteUser(follower) ? follower.sharedInbox : null,
			followeeHost: followee.host,
			followeeInbox: this.usersRepository.isRemoteUser(followee) ? followee.inbox : null,
			followeeSharedInbox: this.usersRepository.isRemoteUser(followee) ? followee.sharedInbox : null,
		}).catch(e => {
			if (isDuplicateKeyValueError(e) && this.usersRepository.isRemoteUser(follower) && this.usersRepository.isLocalUser(followee)) {
				logger.info(`Insert duplicated ignore. ${follower.id} => ${followee.id}`);
				alreadyFollowed = true;
			} else {
				throw e;
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
			createNotification(follower.id, 'followRequestAccepted', {
				notifierId: followee.id,
			});
		}
	
		if (alreadyFollowed) return;
	
		//#region Increment counts
		await Promise.all([
			this.usersRepository.increment({ id: follower.id }, 'followingCount', 1),
			this.usersRepository.increment({ id: followee.id }, 'followersCount', 1),
		]);
		//#endregion
	
		//#region Update instance stats
		if (this.usersRepository.isRemoteUser(follower) && this.usersRepository.isLocalUser(followee)) {
			this.federatedInstanceService.registerOrFetchInstanceDoc(follower.host).then(i => {
				this.instancesRepository.increment({ id: i.id }, 'followingCount', 1);
				this.instanceChart.updateFollowing(i.host, true);
			});
		} else if (this.usersRepository.isLocalUser(follower) && this.usersRepository.isRemoteUser(followee)) {
			this.federatedInstanceService.registerOrFetchInstanceDoc(followee.host).then(i => {
				this.instancesRepository.increment({ id: i.id }, 'followersCount', 1);
				this.instanceChart.updateFollowers(i.host, true);
			});
		}
		//#endregion
	
		this.perUserFollowingChart.update(follower, followee, true);
	
		// Publish follow event
		if (this.usersRepository.isLocalUser(follower)) {
			this.usersRepository.pack(followee.id, follower, {
				detail: true,
			}).then(async packed => {
				this.globalEventServie.publishUserEvent(follower.id, 'follow', packed as Packed<'UserDetailedNotMe'>);
				this.globalEventServie.publishMainStream(follower.id, 'follow', packed as Packed<'UserDetailedNotMe'>);
	
				const webhooks = (await this.webhookService.getActiveWebhooks()).filter(x => x.userId === follower.id && x.on.includes('follow'));
				for (const webhook of webhooks) {
					this.queueService.webhookDeliver(webhook, 'follow', {
						user: packed,
					});
				}
			});
		}
	
		// Publish followed event
		if (this.usersRepository.isLocalUser(followee)) {
			this.usersRepository.pack(follower.id, followee).then(async packed => {
				this.globalEventServie.publishMainStream(followee.id, 'followed', packed);
	
				const webhooks = (await this.webhookService.getActiveWebhooks()).filter(x => x.userId === followee.id && x.on.includes('followed'));
				for (const webhook of webhooks) {
					this.queueService.webhookDeliver(webhook, 'followed', {
						user: packed,
					});
				}
			});
	
			// 通知を作成
			createNotification(followee.id, 'follow', {
				notifierId: follower.id,
			});
		}
	}

	public async unfollow(follower: { id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox']; }, followee: { id: User['id']; host: User['host']; uri: User['host']; inbox: User['inbox']; sharedInbox: User['sharedInbox']; }, silent = false) {
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
		if (!silent && this.usersRepository.isLocalUser(follower)) {
			this.usersRepository.pack(followee.id, follower, {
				detail: true,
			}).then(async packed => {
				this.globalEventServie.publishUserEvent(follower.id, 'unfollow', packed);
				this.globalEventServie.publishMainStream(follower.id, 'unfollow', packed);
	
				const webhooks = (await this.webhookService.getActiveWebhooks()).filter(x => x.userId === follower.id && x.on.includes('unfollow'));
				for (const webhook of webhooks) {
					this.queueService.webhookDeliver(webhook, 'unfollow', {
						user: packed,
					});
				}
			});
		}
	
		if (this.usersRepository.isLocalUser(follower) && this.usersRepository.isRemoteUser(followee)) {
			const content = renderActivity(renderUndo(renderFollow(follower, followee), follower));
			this.queueService.deliver(follower, content, followee.inbox);
		}
	
		if (this.usersRepository.isLocalUser(followee) && this.usersRepository.isRemoteUser(follower)) {
			// local user has null host
			const content = renderActivity(renderReject(renderFollow(follower, followee), followee));
			this.queueService.deliver(followee, content, follower.inbox);
		}
	}
	
	public async decrementFollowing(follower: { id: User['id']; host: User['host']; }, followee: { id: User['id']; host: User['host']; }) {
		//#region Decrement following / followers counts
		await Promise.all([
			this.usersRepository.decrement({ id: follower.id }, 'followingCount', 1),
			this.usersRepository.decrement({ id: followee.id }, 'followersCount', 1),
		]);
		//#endregion
	
		//#region Update instance stats
		if (this.usersRepository.isRemoteUser(follower) && this.usersRepository.isLocalUser(followee)) {
			this.federatedInstanceService.registerOrFetchInstanceDoc(follower.host).then(i => {
				this.instancesRepository.decrement({ id: i.id }, 'followingCount', 1);
				this.instanceChart.updateFollowing(i.host, false);
			});
		} else if (this.usersRepository.isLocalUser(follower) && this.usersRepository.isRemoteUser(followee)) {
			this.federatedInstanceService.registerOrFetchInstanceDoc(followee.host).then(i => {
				this.instancesRepository.decrement({ id: i.id }, 'followersCount', 1);
				this.instanceChart.updateFollowers(i.host, false);
			});
		}
		//#endregion
	
		this.perUserFollowingChart.update(follower, followee, false);
	}
}
