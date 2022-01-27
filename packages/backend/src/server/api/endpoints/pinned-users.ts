import define from '../define';
import { Users } from '@/models/index';
import { fetchMeta } from '@/misc/fetch-meta';
import * as Acct from 'misskey-js/built/acct';
import { User } from '@/models/entities/user';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	params: {
	},

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

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const meta = await fetchMeta();

	const users = await Promise.all(meta.pinnedUsers.map(acct => Users.findOne(Acct.parse(acct))));

	return await Users.packMany(users.filter(x => x !== undefined) as User[], me, { detail: true });
});
