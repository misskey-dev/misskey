import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import UserList from '../../../../../models/user-list';
import User, { pack as packUser } from '../../../../../models/user';
import { publishUserListStream } from '../../../../../services/stream';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストから指定したユーザーを削除します。',
		'en-US': 'Remove a user to a user list.'
	},

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
	}
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	// Fetch the list
	const userList = await UserList.findOne({
		_id: ps.listId,
		userId: me._id,
	});

	if (userList == null) {
		return rej('list not found');
	}

	// Fetch the user
	const user = await User.findOne({
		_id: ps.userId
	});

	if (user == null) {
		return rej('user not found');
	}

	// Pull the user
	await UserList.update({ _id: userList._id }, {
		$pull: {
			userIds: user._id
		}
	});

	res();

	publishUserListStream(userList._id, 'userRemoved', await packUser(user));
}));
