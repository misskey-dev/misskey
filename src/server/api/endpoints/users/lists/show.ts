import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import UserList, { pack } from '../../../../../models/user-list';
import { ILocalUser } from '../../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストの情報を取得します。',
		'en-US': 'Show a user list.'
	},

	requireCredential: true,

	kind: 'account-read'
};

export default async (params: any, me: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'listId' parameter
	const [listId, listIdErr] = $.type(ID).get(params.listId);
	if (listIdErr) return rej('invalid listId param');

	// Fetch the list
	const userList = await UserList.findOne({
		_id: listId,
		userId: me._id,
	});

	if (userList == null) {
		return rej('list not found');
	}

	res(await pack(userList));
});
