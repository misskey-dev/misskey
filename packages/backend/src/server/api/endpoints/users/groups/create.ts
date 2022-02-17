import define from '../../../define';
import { UserGroups, UserGroupJoinings } from '@/models/index';
import { genId } from '@/misc/gen-id';
import { UserGroup } from '@/models/entities/user-group';
import { UserGroupJoining } from '@/models/entities/user-group-joining';

export const meta = {
	tags: ['groups'],

	requireCredential: true,

	kind: 'write:user-groups',

	params: {
		type: 'object',
		properties: {
			name: { type: 'string', minLength: 1, maxLength: 100, },
		},
		required: ['name'],
	},

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserGroup',
	},
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, async (ps, user) => {
	const userGroup = await UserGroups.insert({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		name: ps.name,
	} as UserGroup).then(x => UserGroups.findOneOrFail(x.identifiers[0]));

	// Push the owner
	await UserGroupJoinings.insert({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		userGroupId: userGroup.id,
	} as UserGroupJoining);

	return await UserGroups.pack(userGroup);
});
