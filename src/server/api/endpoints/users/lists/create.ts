import $ from 'cafy';
import UserList, { pack } from '../../../../../models/user-list';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーリストを作成します。',
		'en-US': 'Create a user list'
	},

	tags: ['lists'],

	requireCredential: true,

	kind: 'account-write',

	params: {
		title: {
			validator: $.str.range(1, 100)
		}
	}
};

export default define(meta, async (ps, user) => {
	const userList = await UserList.insert({
		createdAt: new Date(),
		userId: user._id,
		title: ps.title,
		userIds: []
	});

	return await pack(userList);
});
