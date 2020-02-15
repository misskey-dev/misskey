import $ from 'cafy';
import define from '../../../define';
import { UserGroups, UserGroupJoinings } from '../../../../../models';
import { genId } from '../../../../../misc/gen-id';
import { UserGroup } from '../../../../../models/entities/user-group';
import { UserGroupJoining } from '../../../../../models/entities/user-group-joining';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーグループを作成します。',
		'en-US': 'Create a user group.'
	},

	tags: ['groups'],

	requireCredential: true as const,

	kind: 'write:user-groups',

	params: {
		name: {
			validator: $.str.range(1, 100)
		}
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'UserGroup',
	},
};

export default define(meta, async (ps, user) => {
	const userGroup = await UserGroups.save({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		name: ps.name,
	} as UserGroup);

	// Push the owner
	await UserGroupJoinings.save({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		userGroupId: userGroup.id
	} as UserGroupJoining);

	return await UserGroups.pack(userGroup);
});
