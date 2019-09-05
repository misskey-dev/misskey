import $ from 'cafy';
import { ID } from '../../../../../../misc/cafy-id';
import define from '../../../../define';
import { ApiError } from '../../../../error';
import { UserGroupInvites, UserGroupJoinings } from '../../../../../../models';
import { genId } from '../../../../../../misc/gen-id';
import { UserGroupJoining } from '../../../../../../models/entities/user-group-joining';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーグループへの招待を承認します。',
		'en-US': 'Accept invite of a user group.'
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
			id: '98c11eca-c890-4f42-9806-c8c8303ebb5e'
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

	// Push the user
	await UserGroupJoinings.save({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		userGroupId: invite.userGroupId
	} as UserGroupJoining);

	UserGroupInvites.delete(invite.id);
});
