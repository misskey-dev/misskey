import $ from 'cafy';
import UserList, { pack } from '../../../../../models/user-list';
import define from '../../../define';

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

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// insert
	const userList = await UserList.insert({
		createdAt: new Date(),
		userId: user._id,
		title: ps.title,
		userIds: []
	});

	// Response
	res(await pack(userList));
}));
