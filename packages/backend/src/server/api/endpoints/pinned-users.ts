import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import type { UsersRepository } from '@/models/index.js';
import * as Acct from '@/misc/acct.js';
import type { User } from '@/models/entities/User.js';
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

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
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

			return await this.userEntityService.packMany(users.filter(x => x !== null) as User[], me, { detail: true });
		});
	}
}
