import define from '../../../define.js';
import { ApiError } from '../../../error.js';
import { getUser } from '../../../common/getters.js';
import { UserGroups, UserGroupJoinings, UserGroupInvitations } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { UserGroupInvitation } from '@/models/entities/user-group-invitation.js';
import { createNotification } from '@/services/create-notification.js';

export const meta = {
	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	description: 'Invite a user to an existing group.',

	errors: {
		noSuchGroup: {
			message: 'No such group.',
			code: 'NO_SUCH_GROUP',
			id: '583f8bc0-8eee-4b78-9299-1e14fc91e409',
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'da52de61-002c-475b-90e1-ba64f9cf13a8',
		},

		alreadyAdded: {
			message: 'That user has already been added to that group.',
			code: 'ALREADY_ADDED',
			id: '7e35c6a0-39b2-4488-aea6-6ee20bd5da2c',
		},

		alreadyInvited: {
			message: 'That user has already been invited to that group.',
			code: 'ALREADY_INVITED',
			id: 'ee0f58b4-b529-4d13-b761-b9a3e69f97e6',
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

	if (joining) {
		throw new ApiError(meta.errors.alreadyAdded);
	}

	const existInvitation = await UserGroupInvitations.findOneBy({
		userGroupId: userGroup.id,
		userId: user.id,
	});

	if (existInvitation) {
		throw new ApiError(meta.errors.alreadyInvited);
	}

	const invitation = await UserGroupInvitations.insert({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		userGroupId: userGroup.id,
	} as UserGroupInvitation).then(x => UserGroupInvitations.findOneByOrFail(x.identifiers[0]));

	// 通知を作成
	createNotification(user.id, 'groupInvited', {
		notifierId: me.id,
		userGroupInvitationId: invitation.id,
	});
});
