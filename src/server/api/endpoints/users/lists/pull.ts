import $ from 'cafy';
import { ID } from '@/misc/cafy-id';
import { publishUserListStream } from '../../../../../services/stream';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getUser } from '../../../common/getters';
import { UserLists, UserListJoinings, Users } from '../../../../../models';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストから指定したユーザーを削除します。',
		'en-US': 'Remove a user to a user list.'
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
			id: '7f44670e-ab16-43b8-b4c1-ccd2ee89cc02'
		},

		noSuchUser: {
			message: 'No such user.',
			code: 'NO_SUCH_USER',
			id: '588e7f72-c744-4a61-b180-d354e912bda2'
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

	// Pull the user
	await UserListJoinings.delete({ userListId: userList.id, userId: user.id });

	publishUserListStream(userList.id, 'userRemoved', await Users.pack(user));
});
