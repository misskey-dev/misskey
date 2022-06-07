import define from '../../../../define.js';
import { ApiError } from '../../../../error.js';
import { UserGroupJoinings, UserGroupInvitations } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { UserGroupJoining } from '@/models/entities/user-group-joining.js';

export const meta = {
	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	description: 'Join a group the authenticated user has been invited to.',

	errors: {
		noSuchInvitation: {
			message: 'No such invitation.',
			code: 'NO_SUCH_INVITATION',
			id: '98c11eca-c890-4f42-9806-c8c8303ebb5e',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		invitationId: { type: 'string', format: 'misskey:id' },
	},
	required: ['invitationId'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, user) => {
	// Fetch the invitation
	const invitation = await UserGroupInvitations.findOneBy({
		id: ps.invitationId,
	});

	if (invitation == null) {
		throw new ApiError(meta.errors.noSuchInvitation);
	}

	if (invitation.userId !== user.id) {
		throw new ApiError(meta.errors.noSuchInvitation);
	}

	// Push the user
	await UserGroupJoinings.insert({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		userGroupId: invitation.userGroupId,
	} as UserGroupJoining);

	UserGroupInvitations.delete(invitation.id);
});
