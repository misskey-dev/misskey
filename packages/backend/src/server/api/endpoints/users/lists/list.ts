import define from '../../../define.js';
import { UserLists } from '@/models/index.js';

export const meta = {
	tags: ['lists', 'account'],

	requireCredential: true,

	kind: 'read:account',

	description: 'Show all lists that the authenticated user has created.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserList',
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
	const userLists = await UserLists.findBy({
		userId: me.id,
	});

	return await Promise.all(userLists.map(x => UserLists.pack(x)));
});
