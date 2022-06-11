import define from '../../../../define.js';
import { ApiError } from '../../../../error.js';
import { UserGroupInvitations } from '@/models/index.js';

export const meta = {
	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	description: 'Delete an existing group invitation for the authenticated user without joining the group.',

	errors: {
		noSuchInvitation: {
			message: 'No such invitation.',
			code: 'NO_SUCH_INVITATION',
			id: 'ad7471d4-2cd9-44b4-ac68-e7136b4ce656',
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

	await UserGroupInvitations.delete(invitation.id);
});
