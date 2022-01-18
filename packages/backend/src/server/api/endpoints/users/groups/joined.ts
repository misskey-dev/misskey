import define from '../../../define';
import { UserGroups, UserGroupJoinings } from '@/models/index';
import { Not, In } from 'typeorm';

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
	const ownedGroups = await UserGroups.find({
		userId: me.id,
	});

	const joinings = await UserGroupJoinings.find({
		userId: me.id,
		...(ownedGroups.length > 0 ? {
			userGroupId: Not(In(ownedGroups.map(x => x.id))),
		} : {}),
	});

	return await Promise.all(joinings.map(x => UserGroups.pack(x.userGroupId)));
});
