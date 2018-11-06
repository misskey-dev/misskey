import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import UserList, { pack } from '../../../../../models/user-list';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストを更新します。',
		'en-US': 'Update a user list'
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
		},

		title: {
			validator: $.str.range(1, 100),
			desc: {
				'ja-JP': 'このユーザーリストの名前',
				'en-US': 'name of this user list'
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Fetch the list
	const userList = await UserList.findOne({
		_id: ps.listId,
		userId: user._id
	});

	if (userList == null) {
		return rej('list not found');
	}

	// update
	await UserList.update({ _id: userList._id }, {
		$set: {
			title: ps.title
		}
	});

	// Response
	res(await pack(userList._id));
}));
