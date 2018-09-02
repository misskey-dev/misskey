import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import UserList, { pack } from '../../../../../models/user-list';
import { ILocalUser } from '../../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストを更新します。',
		'en-US': 'Update a user list'
	},

	requireCredential: true,

	kind: 'account-write'
};

export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'listId' parameter
	const [listId, listIdErr] = $.type(ID).get(params.listId);
	if (listIdErr) return rej('invalid listId param');

	// Get 'title' parameter
	const [title, titleErr] = $.str.range(1, 100).get(params.title);
	if (titleErr) return rej('invalid title param');

	// Fetch the list
	const userList = await UserList.findOne({
		_id: listId,
		userId: user._id
	});

	if (userList == null) {
		return rej('list not found');
	}

	// update
	await UserList.update({ _id: userList._id }, {
		$set: {
			title
		}
	});

	// Response
	res(await pack(userList));
});
