import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getUser } from '../../../common/getters';
import { UserGroups, UserGroupJoinings } from '@/models/index';

export const meta = {
	tags: ['groups', 'users'],

	requireCredential: true as const,

	kind: 'write:user-groups',

	params: {
		groupId: {
			validator: $.type(ID),
		},

		userId: {
			validator: $.type(ID),
		},
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
		ref: 'UserGroup',
	},

	errors: {
		noSuchGroup: {
			message: 'No such group.',
			code: 'NO_SUCH_GROUP',
			id: '8e31d36b-2f88-4ccd-a438-e2d78a9162db'
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '711f7ebb-bbb9-4dfa-b540-b27809fed5e9'
		},

		noSuchGroupMember: {
			message: 'No such group member.',
			code: 'NO_SUCH_GROUP_MEMBER',
			id: 'd31bebee-196d-42c2-9a3e-9474d4be6cc4'
		},
	}
};

export default define(meta, async (ps, me) => {
	// Fetch the group
	const userGroup = await UserGroups.findOne({
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

	const joining = await UserGroupJoinings.findOne({
		userGroupId: userGroup.id,
		userId: user.id
	});

	if (joining == null) {
		throw new ApiError(meta.errors.noSuchGroupMember);
	}

	await UserGroups.update(userGroup.id, {
		userId: ps.userId
	});

	return await UserGroups.pack(userGroup.id);
});
