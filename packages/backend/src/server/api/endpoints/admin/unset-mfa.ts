/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import { MiUserProfile } from '@/models/UserProfile.js';
import { MiUserSecurityKey } from '@/models/UserSecurityKey.js';
import type { UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:unset-mfa',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'ccafc7fe-5074-4edd-9dc0-8ef9ef6a701d',
		},
	},
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
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });

			if (user == null) {
				throw new ApiError(meta.errors.noSuchUser);
			}

			await this.db.transaction(async (transactionalEntityManager) => {
				// パスキーを全て削除
				await transactionalEntityManager.delete(MiUserSecurityKey, { userId: user.id });

				// TOTP・パスワードレスログインを無効化
				await transactionalEntityManager.update(MiUserProfile, { userId: user.id }, {
					twoFactorSecret: null,
					twoFactorBackupSecret: null,
					twoFactorEnabled: false,
					usePasswordLessLogin: false,
				});
			}).then(() => {
				this.moderationLogService.log(me, 'unsetMfa', {
					userId: user.id,
					userUsername: user.username,
					userHost: user.host,
				});
			});
		});
	}
}
