import $ from 'cafy';
import { ID } from '../../../../../misc/cafy-id';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getUser } from '../../../common/getters';
import { pushUserToUserList } from '../../../../../services/user-list/push';
import { UserLists, UserListJoinings } from '../../../../../models';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストに指定したユーザーを追加します。',
		'en-US': 'Add a user to a user list.'
	},

	tags: ['lists', 'users'],

	requireCredential: true as const,

	kind: 'write:account',

	params: {
		listId: {
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
		noSuchList: {
			message: 'No such list.',
			code: 'NO_SUCH_LIST',
			id: '2214501d-ac96-4049-b717-91e42272a711'
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: 'a89abd3d-f0bc-4cce-beb1-2f446f4f1e6a'
		},

		alreadyAdded: {
			message: 'That user has already been added to that list.',
			code: 'ALREADY_ADDED',
			id: '1de7c884-1595-49e9-857e-61f12f4d4fc5'
		}
	}
};

export default define(meta, async (ps, me) => {
	// Fetch the list
	const userList = await UserLists.findOne({
		id: ps.listId,
		userId: me.id,
	});

	if (userList == null) {
		throw new ApiError(meta.errors.noSuchList);
	}

	// Fetch the user
	const user = await getUser(ps.userId).catch(e => {
		if (e.id === '15348ddd-432d-49c2-8a5a-8069753becff') throw new ApiError(meta.errors.noSuchUser);
		throw e;
	});

	const exist = await UserListJoinings.findOne({
		userListId: userList.id,
		userId: user.id
	});

	if (exist) {
		throw new ApiError(meta.errors.alreadyAdded);
	}

	// Push the user
	await pushUserToUserList(user, userList);
});
