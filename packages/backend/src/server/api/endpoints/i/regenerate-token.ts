/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IEndpointMeta } from '@/server/api/endpoints.js';
import type { Schema } from '@/misc/json-schema.js';
import type { UsersRepository, UserProfilesRepository } from '@/models/_.js';
import generateUserToken from '@/misc/generate-native-user-token.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	requireCredential: true,

	secure: true,
} as const satisfies IEndpointMeta;

export const paramDef = {
	type: 'object',
	properties: {
		password: { type: 'string' },
	},
	required: ['password'],
} as const satisfies Schema;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const freshUser = await this.usersRepository.findOneByOrFail({ id: me.id });
			const oldToken = freshUser.token!;

			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: me.id });

			// Compare password
			const same = await bcrypt.compare(ps.password, profile.password!);

			if (!same) {
				throw new Error('incorrect password');
			}

			const newToken = generateUserToken();

			await this.usersRepository.update(me.id, {
				token: newToken,
			});

			// Publish event
			this.globalEventService.publishInternalEvent('userTokenRegenerated', { id: me.id, oldToken, newToken });
			this.globalEventService.publishMainStream(me.id, 'myTokenRegenerated');
		});
	}
}
