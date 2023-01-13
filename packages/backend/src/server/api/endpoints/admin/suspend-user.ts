import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository, FollowingsRepository, NotificationsRepository } from '@/models/index.js';
import type { User } from '@/models/entities/User.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { UserSuspendService } from '@/core/UserSuspendService.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';

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
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.notificationsRepository)
		private notificationsRepository: NotificationsRepository,

		private userEntityService: UserEntityService,
		private userFollowingService: UserFollowingService,
		private userSuspendService: UserSuspendService,
		private roleService: RoleService,
		private moderationLogService: ModerationLogService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });

			if (user == null) {
				throw new Error('user not found');
			}

			if (await this.roleService.isModerator(user)) {
				throw new Error('cannot suspend moderator account');
			}

			await this.usersRepository.update(user.id, {
				isSuspended: true,
			});

			this.moderationLogService.insertModerationLog(me, 'suspend', {
				targetId: user.id,
			});

			// Terminate streaming
			if (this.userEntityService.isLocalUser(user)) {
				this.globalEventService.publishUserEvent(user.id, 'terminate', {});
			}

			(async () => {
				await this.userSuspendService.doPostSuspend(user).catch(e => {});
				await this.unFollowAll(user).catch(e => {});
				await this.readAllNotify(user).catch(e => {});
			})();
		});
	}

	@bindThis
	private async unFollowAll(follower: User) {
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
	
	@bindThis
	private async readAllNotify(notifier: User) {
		await this.notificationsRepository.update({
			notifierId: notifier.id,
			isRead: false,
		}, {
			isRead: true,
		});
	}
}
