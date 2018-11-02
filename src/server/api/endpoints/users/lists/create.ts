import $ from 'cafy';
import UserList, { pack } from '../../../../../models/user-list';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーリストを作成します。',
		'en-US': 'Create a user list'
	},

	requireCredential: true,

	kind: 'account-write',

	params: {
		title: {
			validator: $.str.range(1, 100)
		}
	}
};

export default async (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	// insert
	const userList = await UserList.insert({
		createdAt: new Date(),
		userId: user._id,
		title: ps.title,
		userIds: []
	});

	// Response
	res(await pack(userList));
});
