import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import UserList, { pack } from '../../../../../models/user-list';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーリストを更新します。',
		'en-US': 'Update a user list'
	},

	requireCredential: true,

	kind: 'account-write',

	params: {
		listId: $.type(ID).note({
			desc: {
				'ja-JP': '対象となるユーザーリストのID',
				'en-US': 'ID of target user list'
			}
		}),
		title: $.str.range(1, 100).note({
			desc: {
				'ja-JP': 'このユーザーリストの名前',
				'en-US': 'name of this user list'
			}
		})
	}
};

export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) throw psErr;

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
});
