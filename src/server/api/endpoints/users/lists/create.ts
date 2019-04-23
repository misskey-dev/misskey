import $ from 'cafy';
import define from '../../../define';
import { UserLists } from '../../../../../models';
import { genId } from '../../../../../misc/gen-id';
import { UserList } from '../../../../../models/entities/user-list';
import { types, bool } from '../../../../../misc/schema';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーリストを作成します。',
		'en-US': 'Create a user list'
	},

	tags: ['lists'],

	requireCredential: true,

	kind: 'write:account',

	params: {
		name: {
			validator: $.str.range(1, 100)
		}
	},

	res: {
		type: types.object,
		optional: bool.false, nullable: bool.false,
		ref: 'UserList',
	},
};

export default define(meta, async (ps, user) => {
	const userList = await UserLists.save({
		id: genId(),
		createdAt: new Date(),
		userId: user.id,
		name: ps.name,
	} as UserList);

	return await UserLists.pack(userList);
});
