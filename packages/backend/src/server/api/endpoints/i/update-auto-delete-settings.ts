/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { UsersRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['account'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		invalidValue: {
			message: 'Invalid value.',
			code: 'INVALID_VALUE',
			id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		autoDeleteNotesAfterDays: {
			type: 'number',
			nullable: true,
			minimum: 1,
			maximum: 3650, // 최대 10년
		},
		autoDeleteKeepFavorites: {
			type: 'boolean',
		},
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const updates: Record<string, any> = {};

			if (ps.autoDeleteNotesAfterDays !== undefined) {
				updates.autoDeleteNotesAfterDays = ps.autoDeleteNotesAfterDays;
			}

			if (ps.autoDeleteKeepFavorites !== undefined) {
				updates.autoDeleteKeepFavorites = ps.autoDeleteKeepFavorites;
			}

			await this.usersRepository.update(me.id, updates);

			return await this.usersRepository.findOneByOrFail({ id: me.id });
		});
	}
}
