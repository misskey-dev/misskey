import { IsNull, Not } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository, FollowingsRepository } from '@/models/index.js';
import type { User } from '@/models/entities/User.js';
import type { RelationshipJobData } from '@/queue/types.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { UserSuspendService } from '@/core/UserSuspendService.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { QueueService } from '@/core/QueueService.js';

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<'admin/suspend-user'> {
	name = 'admin/suspend-user' as const;
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userSuspendService: UserSuspendService,
		private roleService: RoleService,
		private moderationLogService: ModerationLogService,
		private queueService: QueueService,
	) {
		super(async (ps, me) => {
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

			(async () => {
				await this.userSuspendService.doPostSuspend(user).catch(e => {});
				await this.unFollowAll(user).catch(e => {});
			})();
		});
	}

	@bindThis
	private async unFollowAll(follower: User) {
		const followings = await this.followingsRepository.find({
			where: {
				followerId: follower.id,
				followeeId: Not(IsNull()),
			},
		});

		const jobs: RelationshipJobData[] = [];
		for (const following of followings) {
			if (following.followeeId && following.followerId) {
				jobs.push({
					from: { id: following.followerId },
					to: { id: following.followeeId },
					silent: true,
				});
			}
		}
		this.queueService.createUnfollowJob(jobs);
	}
}
