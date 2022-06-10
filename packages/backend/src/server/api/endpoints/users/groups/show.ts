import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { UserGroups, UserGroupJoinings } from '@/models/index.js';

export const meta = {
	tags: ['groups', 'account'],

	requireCredential: true,

	kind: 'read:user-groups',

	description: 'Show the properties of a group.',

	res: {
		type: 'object',
		optional: false, nullable: false,
		ref: 'UserGroup',
	},

	errors: {
		noSuchGroup: {
			message: 'No such group.',
			code: 'NO_SUCH_GROUP',
			id: 'ea04751e-9b7e-487b-a509-330fb6bd6b9b',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		groupId: { type: 'string', format: 'misskey:id' },
	},
	required: ['groupId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	// Fetch the group
	const userGroup = await UserGroups.findOneBy({
		id: ps.groupId,
	});

	if (userGroup == null) {
		throw new ApiError(meta.errors.noSuchGroup);
	}

	const joining = await UserGroupJoinings.findOneBy({
		userId: me.id,
		userGroupId: userGroup.id,
	});

	if (joining == null && userGroup.userId !== me.id) {
		throw new ApiError(meta.errors.noSuchGroup);
	}

	return await UserGroups.pack(userGroup);
});
