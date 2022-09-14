import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { Users } from '@/models/index.js';
import { ModerationLogService } from '@/services/ModerationLogService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
		overrideMb: { type: 'number', nullable: true },
	},
	required: ['userId', 'overrideMb'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });

			if (user == null) {
				throw new Error('user not found');
			}

			if (!this.usersRepository.isLocalUser(user)) {
				throw new Error('user is not local user');
			} 

			/*if (user.isAdmin) {
		throw new Error('cannot suspend admin');
	}
	if (user.isModerator) {
		throw new Error('cannot suspend moderator');
	}*/

			await this.usersRepository.update(user.id, {
				driveCapacityOverrideMb: ps.overrideMb,
			});

			this.moderationLogService.insertModerationLog(me, 'change-drive-capacity-override', {
				targetId: user.id,
			});
		});
	}
}
