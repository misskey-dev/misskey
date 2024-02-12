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
			id: 'd4f9440a-45aa-495c-af66-b4d1e339d4fc',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: { type: 'string', minLength: 1 },
		name: { type: 'string', nullable: true },
		redirectUris: {
			type: 'array', minItems: 1,
			items: { type: 'string' },
		},
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

			await this.indieAuthClientsRepository.update(client.id, {
				name: ps.name,
				redirectUris: ps.redirectUris,
			});

			const updatedClient = await this.indieAuthClientsRepository.findOneByOrFail({ id: client.id });

			this.moderationLogService.log(me, 'updateIndieAuthClient', {
				clientId: client.id,
				before: client,
				after: updatedClient,
			});
		});
	}
}
