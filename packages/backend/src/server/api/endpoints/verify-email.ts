/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UserProfilesRepository } from '@/models/_.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { ApiError } from '../error.js';

export const meta = {
	requireCredential: false,

	tags: ['account'],

	errors: {
		noSuchCode: {
			message: 'No such code.',
			code: 'NO_SUCH_CODE',
			id: '97c1f576-e4b8-4b8a-a6dc-9cb65e7f6f85',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		code: { type: 'string' },
	},
	required: ['code'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.userProfilesRepository)
		private userProfilesRepository: UserProfilesRepository,

		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps) => {
			const profile = await this.userProfilesRepository.findOneBy({
				emailVerifyCode: ps.code,
			});

			if (profile == null) {
				throw new ApiError(meta.errors.noSuchCode);
			}

			await this.userProfilesRepository.update({ userId: profile.userId }, {
				emailVerified: true,
				emailVerifyCode: null,
			});

			this.globalEventService.publishMainStream(profile.userId, 'meUpdated', await this.userEntityService.pack(profile.userId, { id: profile.userId }, {
				schema: 'MeDetailed',
				includeSecrets: true,
			}));
		});
	}
}

