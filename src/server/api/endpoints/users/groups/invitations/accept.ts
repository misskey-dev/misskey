import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import define from '../../../../define';
import { ApiError } from '../../../../error';
import { UserGroupJoinings, UserGroupInvitations } from '../../../../../../models';
import { genId } from '@/misc/gen-id';
import { UserGroupJoining } from '../../../../../../models/entities/user-group-joining';

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
			id: '98c11eca-c890-4f42-9806-c8c8303ebb5e'
		},
	}
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

	// Push the user
	await UserGroupJoinings.insert({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		userGroupId: invitation.userGroupId
	} as UserGroupJoining);

	UserGroupInvitations.delete(invitation.id);
});
