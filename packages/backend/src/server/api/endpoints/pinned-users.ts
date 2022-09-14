import { IsNull } from 'typeorm';
import { Inject, Injectable } from '@nestjs/common';
import { Users } from '@/models/index.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import * as Acct from '@/misc/acct.js';
import type { User } from '@/models/entities/user.js';
import { Endpoint } from '@/server/api/endpoint-base.js';

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
		@Inject('usersRepository')
		private usersRepository: typeof Users,

		@Inject('notesRepository')
		private notesRepository: typeof Notes,
	) {
		super(meta, paramDef, async (ps, me) => {
			const meta = await fetchMeta();

			const users = await Promise.all(meta.pinnedthis.usersRepository.map(acct => Acct.parse(acct)).map(acct => this.usersRepository.findOneBy({
				usernameLower: acct.username.toLowerCase(),
				host: acct.host ?? IsNull(),
			})));

			return await this.userEntityService.packMany(users.filter(x => x !== undefined) as User[], me, { detail: true });
		});
	}
}
