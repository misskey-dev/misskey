import $ from 'cafy';
import define from '../../../define';
import { UserLists } from '../../../../../models';
import { genId } from '../../../../../misc/gen-id';
import { UserList } from '../../../../../models/entities/user-list';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーリストを作成します。',
		'en-US': 'Create a user list'
	},

	tags: ['lists'],

	requireCredential: true,

	kind: 'write:account',

	params: {
		title: {
			validator: $.str.range(1, 100)
		}
	}
};

export default define(meta, async (ps, user) => {
	const userList = await UserLists.save({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		name: ps.title,
	} as UserList);

	return await UserLists.pack(userList);
});
