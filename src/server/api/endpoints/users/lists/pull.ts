import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import UserList from '../../../../../models/user-list';
import { pack as packUser } from '../../../../../models/user';
import { publishUserListStream } from '../../../../../services/stream';
import define from '../../../define';
import { ApiError } from '../../../error';
import { getUser } from '../../../common/getters';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストから指定したユーザーを削除します。',
		'en-US': 'Remove a user to a user list.'
	},

	tags: ['lists', 'users'],

	requireCredential: true,

	kind: 'account-write',

	params: {
		listId: {
			validator: $.type(ID),
			transform: transform,
		},

		userId: {
			validator: $.type(ID),
			transform: transform,
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
	const userList = await UserList.findOne({
		_id: ps.listId,
		userId: me._id,
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
	await UserList.update({ _id: userList._id }, {
		$pull: {
			userIds: user._id
		}
	});

	publishUserListStream(userList._id, 'userRemoved', await packUser(user));
});
