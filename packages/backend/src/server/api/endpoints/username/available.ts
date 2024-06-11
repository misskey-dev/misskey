/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { UsedUsernamesRepository, UsersRepository } from '@/models/_.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { localUsernameSchema } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import { MetaService } from '@/core/MetaService.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	res: {
		type: 'object',
		optional: false, nullable: false,
		properties: {
			available: {
				type: 'boolean',
				optional: false, nullable: false,
			},
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		username: localUsernameSchema,
	},
	required: ['username'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.usedUsernamesRepository)
		private usedUsernamesRepository: UsedUsernamesRepository,

		private metaService: MetaService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const exist = await this.usersRepository.countBy({
				host: IsNull(),
				usernameLower: ps.username.toLowerCase(),
			});

			const exist2 = await this.usedUsernamesRepository.countBy({ username: ps.username.toLowerCase() });

			const meta = await this.metaService.fetch();
			const isPreserved = meta.preservedUsernames.map(x => x.toLowerCase()).includes(ps.username.toLowerCase());

			return {
				available: exist === 0 && exist2 === 0 && !isPreserved,
			};
		});
	}
}
