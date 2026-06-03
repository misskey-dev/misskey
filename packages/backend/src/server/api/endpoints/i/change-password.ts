/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UserProfilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '@/server/api/error.js';
import { UserAuthService } from '@/core/UserAuthService.js';

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: 'd46ffe5c-200b-4471-aca2-4d0ef197368f',
		},

		invalidCredential: {
			message: 'Invalid credential.',
			code: 'INVALID_CREDENTIAL',
			id: '1e5d4005-3eb0-43f8-b466-87ad864b9fd6',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		currentPassword: { type: 'string' },
		newPassword: { type: 'string', minLength: 1 },
		token: { type: 'string', nullable: true },
	},
	required: ['currentPassword', 'newPassword'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userAuthService: UserAuthService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const token = ps.token;
			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: me.id });

			if (profile.twoFactorEnabled) {
				if (token == null) {
					throw new ApiError(meta.errors.invalidCredential);
				}

				try {
					await this.userAuthService.twoFactorAuthenticate(profile, token);
				} catch (_) {
					throw new ApiError(meta.errors.invalidCredential);
				}
			}

			const passwordMatched = await bcrypt.compare(ps.currentPassword, profile.password!);

			if (!passwordMatched) {
				if (profile.twoFactorEnabled) {
					throw new ApiError(meta.errors.invalidCredential);
				}
				throw new ApiError(meta.errors.incorrectPassword);
			}

			// Generate hash of password
			const salt = await bcrypt.genSalt(8);
			const hash = await bcrypt.hash(ps.newPassword, salt);

			await this.userProfilesRepository.update(me.id, {
				password: hash,
			});
		});
	}
}
