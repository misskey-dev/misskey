/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { AuthSessionsRepository } from '@/models/_.js';
import { AuthSessionEntityService } from '@/core/entities/AuthSessionEntityService.js';
import { DI } from '@/di-symbols.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['auth'],

	requireCredential: false,

	errors: {
		noSuchSession: {
			message: 'No such session.',
			code: 'NO_SUCH_SESSION',
			id: 'bd72c97d-eba7-4adb-a467-f171b8847250',
		},
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			id: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
			app: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'App',
			},
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
		token: { type: 'string' },
	},
	required: ['token'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.authSessionsRepository)
		private authSessionsRepository: AuthSessionsRepository,

		private authSessionEntityService: AuthSessionEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			// Lookup session
			const session = await this.authSessionsRepository.findOneBy({
				token: ps.token,
			});

			if (session == null) {
				throw new ApiError(meta.errors.noSuchSession);
			}

			return await this.authSessionEntityService.pack(session, me);
		});
	}
}
