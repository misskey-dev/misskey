import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../../define';
import { ApiError } from '../../../../error';
import { UserGroupInvitations } from '@/models/index';

export const meta = {
	tags: ['groups', 'users'],

	requireCredential: true as const,

	kind: 'write:user-groups',

	params: {
		invitationId: {
			validator: $.type(ID),
		},
	},

	errors: {
		noSuchInvitation: {
			message: 'No such invitation.',
			code: 'NO_SUCH_INVITATION',
			id: 'ad7471d4-2cd9-44b4-ac68-e7136b4ce656',
		},
	},
};

export default define(meta, async (ps, user) => {
	// Fetch the invitation
	const invitation = await UserGroupInvitations.findOne({
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
