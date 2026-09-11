/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UserProfilesRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { WebAuthnService } from '@/core/WebAuthnService.js';
import { ApiError } from '@/server/api/error.js';
import { TotpService } from '@/core/TotpService.js';

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		userNotFound: {
			message: 'User not found.',
			code: 'USER_NOT_FOUND',
			id: '652f899f-66d4-490e-993e-6606c8ec04c3',
		},

		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: '38769596-efe2-4faf-9bec-abbb3f2cd9ba',
		},
	},

	res: {
		type: 'object',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		password: { type: 'string' },
		token: { type: 'string', nullable: true },
	},
	required: ['password'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private webAuthnService: WebAuthnService,
		private totpService: TotpService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const token = ps.token;
			const profile = await this.userProfilesRepository.findOne({
				where: {
					userId: me.id,
				},
				relations: { user: true },
			});

			if (profile == null) {
				throw new ApiError(meta.errors.userNotFound);
			}

			if (profile.twoFactorEnabled) {
				if (token == null) {
					throw new Error('authentication failed');
				}

				try {
					await this.totpService.twoFactorAuthenticate(profile, token);
				} catch (_) {
					throw new Error('authentication failed');
				}
			}

			const passwordMatched = await bcrypt.compare(ps.password, profile.password ?? '');
			if (!passwordMatched) {
				throw new ApiError(meta.errors.incorrectPassword);
			}

			return await this.webAuthnService.initiateRegistration(
				me.id,
				profile.user?.username ?? me.id,
				profile.user?.name ?? undefined,
			);
		});
	}
}
