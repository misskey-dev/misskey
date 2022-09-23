import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository } from '@/models/index.js';
import { QueueService } from '@/core/QueueService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { UserSuspendService } from '@/core/UserSuspendService.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';

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

		private userEntityService: UserEntityService,
		private queueService: QueueService,
		private globalEventService: GlobalEventService,
		private userSuspendService: UserSuspendService,
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

			if (this.userEntityService.isLocalUser(user)) {
				// 物理削除する前にDelete activityを送信する
				await this.userSuspendService.doPostSuspend(user).catch(err => {});

				this.queueService.createDeleteAccountJob(user, {
					soft: false,
				});
			} else {
				this.queueService.createDeleteAccountJob(user, {
					soft: true, // リモートユーザーの削除は、完全にDBから物理削除してしまうと再度連合してきてアカウントが復活する可能性があるため、soft指定する
				});
			}

			await this.usersRepository.update(user.id, {
				isDeleted: true,
			});

			if (this.userEntityService.isLocalUser(user)) {
				// Terminate streaming
				this.globalEventService.publishUserEvent(user.id, 'terminate', {});
			}
		});
	}
}
