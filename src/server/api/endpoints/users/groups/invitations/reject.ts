import $ from 'cafy';
import { ID } from '../../../../../../misc/cafy-id';
import define from '../../../../define';
import { ApiError } from '../../../../error';
import { UserGroupInvitations } from '../../../../../../models';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーグループへの招待を拒否します。',
		'en-US': 'Reject invitation of a user group.'
	},

	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	params: {
		invitationId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '招待ID',
				'en-US': 'The invitation ID'
			}
		},
	},

	errors: {
		noSuchInvitation: {
			message: 'No such invitation.',
			code: 'NO_SUCH_INVITATION',
			id: 'ad7471d4-2cd9-44b4-ac68-e7136b4ce656'
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

	await UserGroupInvitations.delete(invitation.id);
});
