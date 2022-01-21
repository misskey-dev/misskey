import define from '../../../define';
import { UserGroups } from '@/models/index';

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

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, me) => {
	const userGroups = await UserGroups.find({
		userId: me.id,
	});

	return await Promise.all(userGroups.map(x => UserGroups.pack(x)));
});
