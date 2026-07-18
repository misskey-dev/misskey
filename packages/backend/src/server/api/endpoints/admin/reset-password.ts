/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { ApiError } from '@/server/api/error.js';
import type { UsersRepository, UserProfilesRepository, MiMeta } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:reset-password',

	errors: {
		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'ccafc7fe-5074-4edd-9dc0-8ef9ef6a701d',
		},
		cannotResetPasswordOfRootUser: {
			message: 'Cannot reset password of the root user.',
			code: 'CANNOT_RESET_PASSWORD_OF_ROOT_USER',
			id: 'f28fc207-42ca-44c7-a577-44b4f0ec5999',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			password: {
				type: 'string',
				optional: false, nullable: false,
				minLength: 8,
				maxLength: 8,
			},
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
		@Inject(DI.meta)
		private serverSettings: MiMeta,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });

			if (user == null) {
				throw new ApiError(meta.errors.noSuchUser);
			}

			if (this.serverSettings.rootUserId === user.id) {
				throw new ApiError(meta.errors.cannotResetPasswordOfRootUser);
			}

			const passwd = secureRndstr(8);

			// Generate hash of password
			const hash = bcrypt.hashSync(passwd);

			await this.userProfilesRepository.update({
				userId: user.id,
			}, {
				password: hash,
			});

			this.moderationLogService.log(me, 'resetPassword', {
				userId: user.id,
				userUsername: user.username,
				userHost: user.host,
			});

			return {
				password: passwd,
			};
		});
	}
}
