import $ from 'cafy';
import { ID } from '../../../../../../misc/cafy-id';
import define from '../../../../define';
import { ApiError } from '../../../../error';
import { UserGroupInvites } from '../../../../../../models';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーグループへの招待を拒否します。',
		'en-US': 'Reject invite of a user group.'
	},

	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	params: {
		inviteId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '招待ID',
				'en-US': 'The invite ID'
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
	const invite = await UserGroupInvites.findOne({
		id: ps.inviteId,
	});

	if (invite == null) {
		throw new ApiError(meta.errors.noSuchInvitation);
	}

	if (invite.userId !== user.id) {
		throw new ApiError(meta.errors.noSuchInvitation);
	}

	await UserGroupInvites.delete(invite.id);
});
