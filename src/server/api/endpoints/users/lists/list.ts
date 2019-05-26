import define from '../../../define';
import { UserLists } from '../../../../../models';
import { types, bool } from '../../../../../misc/schema';

export const meta = {
	desc: {
		'ja-JP': '自分の作成したユーザーリスト一覧を取得します。'
	},

	tags: ['lists', 'account'],

	requireCredential: true,

	kind: 'read:account',

	res: {
		type: types.array,
		optional: bool.false, nullable: bool.false,
		items: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			ref: 'UserList',
		}
	},
};

export default define(meta, async (ps, me) => {
	const userLists = await UserLists.find({
		userId: me.id,
	});

	return await Promise.all(userLists.map(x => UserLists.pack(x)));
});
