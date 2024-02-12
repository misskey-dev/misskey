/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IndieAuthClientsRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
	kind: 'read:admin:indie-auth',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
				},
				createdAt: {
					type: 'string',
					optional: false, nullable: false,
					format: 'date-time',
				},
				name: {
					type: 'string',
					optional: false, nullable: true,
				},
				redirectUris: {
					type: 'array',
					optional: false, nullable: false,
					items: { type: 'string' },
				},
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.indieAuthClientsRepository)
		private indieAuthClientsRepository: IndieAuthClientsRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const query = this.indieAuthClientsRepository.createQueryBuilder('client');
			const clients = await query.offset(ps.offset).limit(ps.limit).getMany();

			return clients.map(client => ({
				id: client.id,
				createdAt: client.createdAt.toISOString(),
				name: client.name,
				redirectUris: client.redirectUris,
			}));
		});
	}
}
