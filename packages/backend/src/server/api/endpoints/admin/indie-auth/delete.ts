/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IndieAuthClientsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import { ApiError } from '../../../error.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'write:admin:indie-auth',

	errors: {
		noSuchIndieAuthClient: {
			message: 'No such client',
			code: 'NO_SUCH_CLIENT',
			id: '02c4e690-af0c-4dc9-9f2f-c436c3b2782d',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string' },
	},
	required: ['id'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.indieAuthClientsRepository)
		private indieAuthClientsRepository: IndieAuthClientsRepository,

		private moderationLogService: ModerationLogService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const client = await this.indieAuthClientsRepository.findOneBy({ id: ps.id });

			if (client == null) throw new ApiError(meta.errors.noSuchIndieAuthClient);

			await this.indieAuthClientsRepository.delete(client.id);

			this.moderationLogService.log(me, 'deleteIndieAuthClient', {
				clientId: client.id,
				client: client,
			});
		});
	}
}
