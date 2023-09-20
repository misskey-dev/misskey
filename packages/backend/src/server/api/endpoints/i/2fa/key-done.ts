/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import bcrypt from 'bcryptjs';
import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import type { UserProfilesRepository, UserSecurityKeysRepository } from '@/models/_.js';
import { WebAuthnService } from '@/core/WebAuthnService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	requireCredential: true,

	secure: true,

	errors: {
		incorrectPassword: {
			message: 'Incorrect password.',
			code: 'INCORRECT_PASSWORD',
			id: '0d7ec6d2-e652-443e-a7bf-9ee9a0cd77b0',
		},

		twoFactorNotEnabled: {
			message: '2fa not enabled.',
			code: 'TWO_FACTOR_NOT_ENABLED',
			id: '798d6847-b1ed-4f9c-b1f9-163c42655995',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		password: { type: 'string' },
		name: { type: 'string', minLength: 1, maxLength: 30 },
		credential: { type: 'object' },
	},
	required: ['password', 'name', 'credential'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		@Inject(DI.userSecurityKeysRepository)
		private userSecurityKeysRepository: UserSecurityKeysRepository,

		private webAuthnService: WebAuthnService,
		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const profile = await this.userProfilesRepository.findOneByOrFail({ userId: me.id });

			// Compare password
			const same = await bcrypt.compare(ps.password, profile.password ?? '');

			if (!same) {
				throw new ApiError(meta.errors.incorrectPassword);
			}

			if (!profile.twoFactorEnabled) {
				throw new ApiError(meta.errors.twoFactorNotEnabled);
			}

			const keyInfo = await this.webAuthnService.verifyRegistration(me.id, ps.credential);

			const credentialId = Buffer.from(keyInfo.credentialID).toString('base64url');
			await this.userSecurityKeysRepository.insert({
				id: credentialId,
				userId: me.id,
				name: ps.name,
				publicKey: Buffer.from(keyInfo.credentialPublicKey).toString('base64url'),
				counter: keyInfo.counter,
				credentialDeviceType: keyInfo.credentialDeviceType,
				credentialBackedUp: keyInfo.credentialBackedUp,
				transports: keyInfo.transports,
			});

			// Publish meUpdated event
			this.globalEventService.publishMainStream(me.id, 'meUpdated', await this.userEntityService.pack(me.id, me, {
				detail: true,
				includeSecrets: true,
			}));

			return {
				id: credentialId,
				name: ps.name,
			};
		});
	}
}
