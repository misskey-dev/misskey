import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { Users , Followings , Notifications } from '@/models/index.js';
import type { User } from '@/models/entities/user.js';
import { GlobalEventService } from '@/services/GlobalEventService.js';
import { ModerationLogService } from '@/services/ModerationLogService.js';
import { UserSuspendService } from '@/services/UserSuspendService.js';
import { UserFollowingService } from '@/services/UserFollowingService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('followingsRepository')
		private followingsRepository: typeof Followings,

		@Inject('notificationsRepository')
		private notificationsRepository: typeof Notifications,

		private userFollowingService: UserFollowingService,
		private userSuspendService: UserSuspendService,
		private moderationLogService: ModerationLogService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });

			if (user == null) {
				throw new Error('user not found');
			}

			if (user.isAdmin) {
				throw new Error('cannot suspend admin');
			}

			if (user.isModerator) {
				throw new Error('cannot suspend moderator');
			}

			await this.usersRepository.update(user.id, {
				isSuspended: true,
			});

			this.moderationLogService.insertModerationLog(me, 'suspend', {
				targetId: user.id,
			});

			// Terminate streaming
			if (this.usersRepository.isLocalUser(user)) {
				this.globalEventService.publishUserEvent(user.id, 'terminate', {});
			}

			(async () => {
				await this.userSuspendService.doPostSuspend(user).catch(e => {});
				await this.#unFollowAll(user).catch(e => {});
				await this.#readAllNotify(user).catch(e => {});
			})();
		});
	}

	async #unFollowAll(follower: User) {
		const followings = await this.followingsRepository.findBy({
			followerId: follower.id,
		});
	
		for (const following of followings) {
			const followee = await this.usersRepository.findOneBy({
				id: following.followeeId,
			});
	
			if (followee == null) {
				throw `Cant find followee ${following.followeeId}`;
			}
	
			await this.userFollowingService.unfollow(follower, followee, true);
		}
	}
	
	async #readAllNotify(notifier: User) {
		await this.notificationsRepository.update({
			notifierId: notifier.id,
			isRead: false,
		}, {
			isRead: true,
		});
	}
}
