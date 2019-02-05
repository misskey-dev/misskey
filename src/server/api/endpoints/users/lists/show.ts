import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import UserList, { pack } from '../../../../../models/user-list';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストの情報を取得します。',
		'en-US': 'Show a user list.'
	},

	requireCredential: true,

	kind: 'account-read',

	params: {
		listId: {
			validator: $.type(ID),
			transform: transform,
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

	res(await pack(userList));
}));
