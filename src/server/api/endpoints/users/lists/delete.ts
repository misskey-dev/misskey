import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import UserList from '../../../../../models/user-list';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストを削除します。',
		'en-US': 'Delete a user list'
	},

	requireCredential: true,

	kind: 'account-write',

	params: {
		listId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象となるユーザーリストのID',
				'en-US': 'ID of target user list'
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	const userList = await UserList.findOne({
		_id: ps.listId,
		userId: user._id
	});

	if (userList == null) {
		return rej('list not found');
	}

	await UserList.remove({
		_id: userList._id
	});

	res();
}));
