/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { IsNull } from 'typeorm';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository } from '@/models/_.js';
import { SignupService } from '@/core/SignupService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { localUsernameSchema, passwordSchema } from '@/models/User.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['admin'],

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'User',
		properties: {
			token: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		username: localUsernameSchema,
		password: passwordSchema,
	},
	required: ['username', 'password'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private userEntityService: UserEntityService,
		private signupService: SignupService,
	) {
		super(meta, paramDef, async (ps, _me) => {
			const me = _me ? await this.usersRepository.findOneByOrFail({ id: _me.id }) : null;
			const noUsers = (await this.usersRepository.countBy({
				host: IsNull(),
			})) === 0;
			if (!noUsers && !me?.isRoot) throw new Error('access denied');

			const { account, secret } = await this.signupService.signup({
				username: ps.username,
				password: ps.password,
				ignorePreservedUsernames: true,
			});

			const res = await this.userEntityService.pack(account, account, {
				detail: true,
				includeSecrets: true,
			});

			(res as any).token = secret;

			return res;
		});
	}
}
