import $ from 'cafy';
import ID from '../../../../../misc/cafy-id';
import UserList, { deleteUserList } from '../../../../../models/user-list';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストを削除します。',
		'en-US': 'Delete a user list'
	},

	requireCredential: true,

	kind: 'account-write',

	params: {
		listId: $.type(ID).note({
			desc: {
				'ja-JP': '対象となるユーザーリストのID',
				'en-US': 'ID of target user list'
			}
		})
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	const userList = await UserList.findOne({
		_id: ps.listId,
		userId: user._id
	});

	if (userList == null) {
		return rej('list not found');
	}

	deleteUserList(userList);

	res();
});
