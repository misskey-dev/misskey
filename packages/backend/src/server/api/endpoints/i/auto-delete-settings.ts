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

	kind: 'read:account',

	res: {
		type: 'object',
		properties: {
			autoDeleteNotesAfterDays: {
				type: 'number',
				nullable: true,
			},
			autoDeleteKeepFavorites: {
				type: 'boolean',
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const user = await this.usersRepository.findOneByOrFail({ id: me.id });

			return {
				autoDeleteNotesAfterDays: user.autoDeleteNotesAfterDays,
				autoDeleteKeepFavorites: user.autoDeleteKeepFavorites,
			};
		});
	}
}
