/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { Schema } from '@/misc/json-schema.js';
import type { UsersRepository, UserProfilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { secureRndstr } from '@/misc/secure-rndstr.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:reset-password',

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
} as const satisfies IEndpointMeta;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['userId'],
} as const satisfies Schema;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const user = await this.usersRepository.findOneBy({ id: ps.userId });

			if (user == null) {
				throw new Error('user not found');
			}

			if (user.isRoot) {
				throw new Error('cannot reset password of root');
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
