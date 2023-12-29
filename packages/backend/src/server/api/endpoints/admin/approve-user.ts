import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UserProfilesRepository, UsersRepository } from '@/models/_.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { DI } from '@/di-symbols.js';
import { EmailService } from '@/core/EmailService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:approve-account',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private moderationLogService: ModerationLogService,
		private emailService: EmailService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });

			if (user == null) {
				throw new Error('user not found');
			}

			const profile = await this.userProfilesRepository.findOneBy({ userId: ps.userId });

			await this.usersRepository.update(user.id, {
				approved: true,
			});

			if (profile?.email) {
				this.emailService.sendEmail(profile.email, 'Account Approved',
					'Your Account has been approved have fun socializing!',
					'Your Account has been approved have fun socializing!');
			}

			this.moderationLogService.log(me, 'approve', {
				userId: user.id,
				userUsername: user.username,
				userHost: user.host,
			});
		});
	}
}
