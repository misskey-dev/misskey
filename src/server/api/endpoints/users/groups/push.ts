import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getUser } from '../../../common/getters';
import { UserGroups, UserGroupJoinings } from '../../../../../models';
import { genId } from '../../../../../misc/gen-id';
import { UserGroupJoining } from '../../../../../models/entities/user-group-joining';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーグループに指定したユーザーを追加します。',
		'en-US': 'Add a user to a user group.'
	},

	tags: ['groups', 'users'],

	requireCredential: true,

	kind: 'write:user-groups',

	params: {
		groupId: {
			validator: $.type(ID),
		},

		userId: {
			validator: $.type(ID),
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},
	},

	errors: {
		noSuchGroup: {
			message: 'No such group.',
			code: 'NO_SUCH_GROUP',
			id: '583f8bc0-8eee-4b78-9299-1e14fc91e409'
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'da52de61-002c-475b-90e1-ba64f9cf13a8'
		},

		alreadyAdded: {
			message: 'That user has already been added to that group.',
			code: 'ALREADY_ADDED',
			id: '7e35c6a0-39b2-4488-aea6-6ee20bd5da2c'
		}
	}
};

export default define(meta, async (ps, me) => {
	// Fetch the group
	const userGroup = await UserGroups.findOne({
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

	const exist = await UserGroupJoinings.findOne({
		userGroupId: userGroup.id,
		userId: user.id
	});

	if (exist) {
		throw new ApiError(meta.errors.alreadyAdded);
	}

	// Push the user
	await UserGroupJoinings.save({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		userGroupId: userGroup.id
	} as UserGroupJoining);
});
