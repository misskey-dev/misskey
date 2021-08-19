import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { UserGroups, UserGroupJoinings } from '@/models/index';

export const meta = {
	tags: ['groups', 'account'],

	requireCredential: true as const,

	kind: 'read:user-groups',

	params: {
		groupId: {
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
			id: 'ea04751e-9b7e-487b-a509-330fb6bd6b9b'
		},
	}
};

export default define(meta, async (ps, me) => {
	// Fetch the group
	const userGroup = await UserGroups.findOne({
		id: ps.groupId,
	});

	if (userGroup == null) {
		throw new ApiError(meta.errors.noSuchGroup);
	}

	const joining = await UserGroupJoinings.findOne({
		userId: me.id,
		userGroupId: userGroup.id
	});

	if (joining == null && userGroup.userId !== me.id) {
		throw new ApiError(meta.errors.noSuchGroup);
	}

	return await UserGroups.pack(userGroup);
});
