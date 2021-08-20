import define from '../../../define';
import { UserGroups, UserGroupJoinings } from '@/models/index';
import { Not, In } from 'typeorm';

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
	const ownedGroups = await UserGroups.find({
		userId: me.id,
	});

	const joinings = await UserGroupJoinings.find({
		userId: me.id,
		...(ownedGroups.length > 0 ? {
			userGroupId: Not(In(ownedGroups.map(x => x.id)))
		} : {})
	});

	return await Promise.all(joinings.map(x => UserGroups.pack(x.userGroupId)));
});
