import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import type { UsersRepository } from '@/models/index.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
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

		private roleService: RoleService,
		private moderationLogService: ModerationLogService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });

			if (user == null) {
				throw new Error('user not found');
			}

			if (user.isRoot) {
				throw new Error('cannot silence root');
			}

			if (await this.roleService.isModerator(user)) {
				throw new Error('cannot silence moderator account');
			}

			await this.usersRepository.update(user.id, {
				isSilenced: true,
			});

			this.globalEventService.publishInternalEvent('userChangeSilencedState', { id: user.id, isSilenced: true });

			this.moderationLogService.insertModerationLog(me, 'silence', {
				targetId: user.id,
			});
		});
	}
}
