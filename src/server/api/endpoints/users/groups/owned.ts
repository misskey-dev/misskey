import define from '../../../define';
import { UserGroups } from '../../../../../models';

export const meta = {
	tags: ['groups', 'account'],

	requireCredential: true as const,

	kind: 'read:user-groups',

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'UserGroup',
		}
	},
};

export default define(meta, async (ps, me) => {
	const userGroups = await UserGroups.find({
		userId: me.id,
	});

	return await Promise.all(userGroups.map(x => UserGroups.pack(x)));
});
