import define from '../../../define.js';
import { UserGroups } from '@/models/index.js';

export const meta = {
	tags: ['groups', 'account'],

	requireCredential: true,

	kind: 'read:user-groups',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserGroup',
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
	const userGroups = await UserGroups.find({
		userId: me.id,
	});

	return await Promise.all(userGroups.map(x => UserGroups.pack(x)));
});
