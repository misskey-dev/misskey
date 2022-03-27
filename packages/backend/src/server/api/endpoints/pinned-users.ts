import define from '../define.js';
import { Users } from '@/models/index.js';
import { fetchMeta } from '@/misc/fetch-meta.js';
import * as Acct from '@/misc/acct.js';
import { User } from '@/models/entities/user.js';
import { IsNull } from 'typeorm';

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
export default define(meta, paramDef, async (ps, me) => {
	const meta = await fetchMeta();

	const users = await Promise.all(meta.pinnedUsers.map(acct => Acct.parse(acct)).map(acct => Users.findOneBy({
		usernameLower: acct.username.toLowerCase(),
		host: acct.host ?? IsNull(),
	})));

	return await Users.packMany(users.filter(x => x !== undefined) as User[], me, { detail: true });
});
