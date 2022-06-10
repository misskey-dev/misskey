import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { getUser } from '../../../common/getters.js';
import { UserGroups, UserGroupJoinings } from '@/models/index.js';

export const meta = {
	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	description: 'Transfer ownership of a group from the authenticated user to another user.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserGroup',
	},

	errors: {
		noSuchGroup: {
			message: 'No such group.',
			code: 'NO_SUCH_GROUP',
			id: '8e31d36b-2f88-4ccd-a438-e2d78a9162db',
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '711f7ebb-bbb9-4dfa-b540-b27809fed5e9',
		},

		noSuchGroupMember: {
			message: 'No such group member.',
			code: 'NO_SUCH_GROUP_MEMBER',
			id: 'd31bebee-196d-42c2-9a3e-9474d4be6cc4',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		groupId: { type: 'string', format: 'misskey:id' },
		userId: { type: 'string', format: 'misskey:id' },
	},
	required: ['groupId', 'userId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	// Fetch the group
	const userGroup = await UserGroups.findOneBy({
		id: ps.groupId,
		userId: me.id,
	});

	if (userGroup == null) {
		throw new ApiError(meta.errors.noSuchGroup);
	}

	// Fetch the user
	const user = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	const joining = await UserGroupJoinings.findOneBy({
		userGroupId: userGroup.id,
		userId: user.id,
	});

	if (joining == null) {
		throw new ApiError(meta.errors.noSuchGroupMember);
	}

	await UserGroups.update(userGroup.id, {
		userId: ps.userId,
	});

	return await UserGroups.pack(userGroup.id);
});
