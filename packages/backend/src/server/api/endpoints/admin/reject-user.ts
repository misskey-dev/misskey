/*
 * SPDX-FileCopyrightText: hitalin and yamisskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository, UserProfilesRepository } from '@/models/index.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { EmailService } from '@/core/EmailService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	kind: 'write:admin:reject-account',
	secure: true,
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

			// すでに承認されているユーザーは拒否できない
			if (user.approved) {
				throw new Error('user is already approved');
			}

			// すでに拒否されているユーザーは再度拒否できない
			if (user.rejected) {
				throw new Error('user is already rejected');
			}

			await this.usersRepository.update(user.id, {
				rejected: true,
			});

			// モデレーションログに記録
			this.moderationLogService.log(me, 'reject', {
				userId: user.id,
				userUsername: user.username,
			});

			// メール送信
			const profile = await this.userProfilesRepository.findOneBy({ userId: ps.userId });
			if (profile?.email) {
				this.emailService.sendEmail(profile.email, 'Account Registration Rejected',
					'Your account registration has been rejected by our moderators.',
					'Your account registration has been rejected by our moderators.');
			}
		});
	}
}
