/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from '@/models/_.js';
import * as Acct from '@/misc/acct.js';
import type { MiUser } from '@/models/User.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { MetaService } from '@/core/MetaService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserDetailed',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		private metaService: MetaService,
		private userEntityService: UserEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const meta = await this.metaService.fetch();

			const users = await Promise.all(meta.pinnedUsers.map(acct => Acct.parse(acct)).map(acct => this.usersRepository.findOneBy({
				usernameLower: acct.username.toLowerCase(),
				host: acct.host ?? IsNull(),
			})));

			return await this.userEntityService.packMany(users.filter(x => x !== null) as MiUser[], me, { detail: true });
		});
	}
}
