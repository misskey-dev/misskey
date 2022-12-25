import rndstr from 'rndstr';
import ms from 'ms';
import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { PasswordResetRequestsRepository, UserProfilesRepository, UsersRepository } from '@/models/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { IdService } from '@/core/IdService.js';
import type { Config } from '@/config.js';
import { DI } from '@/di-symbols.js';
import { EmailService } from '@/core/EmailService.js';
import { ApiError } from '../error.js';

export const meta = {
	tags: ['reset password'],

	requireCredential: false,

	description: 'Request a users password to be reset.',

	limit: {
		duration: ms('1hour'),
		max: 3,
	},

	errors: {

	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		username: { type: 'string' },
		email: { type: 'string' },
	},
	required: ['username', 'email'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.config)
		private config: Config,
		
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.passwordResetRequestsRepository)
		private passwordResetRequestsRepository: PasswordResetRequestsRepository,

		private idService: IdService,
		private emailService: EmailService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const user = await this.usersRepository.findOneBy({
				usernameLower: ps.username.toLowerCase(),
				host: IsNull(),
			});

			// 合致するユーザーが登録されていなかったら無視
			if (user == null) {
				return;
			}

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: user.id });

			// 合致するメアドが登録されていなかったら無視
			if (profile.email !== ps.email) {
				return;
			}

			// メアドが認証されていなかったら無視
			if (!profile.emailVerified) {
				return;
			}

			const token = rndstr('a-z0-9', 64);

			await this.passwordResetRequestsRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				userId: profile.userId,
				token,
			});

			const link = `${this.config.url}/reset-password/${token}`;

			this.emailService.sendEmail(ps.email, 'Password reset requested',
				`To reset password, please click this link:<br><a href="${link}">${link}</a>`,
				`To reset password, please click this link: ${link}`);
		});
	}
}
