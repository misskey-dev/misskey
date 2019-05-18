import define from '../../../define';
import { UserGroups, UserGroupJoinings } from '../../../../../models';
import { types, bool } from '../../../../../misc/schema';

export const meta = {
	desc: {
		'ja-JP': '自分の所属するユーザーグループ一覧を取得します。'
	},

	tags: ['groups', 'account'],

	requireCredential: true,

	kind: 'read:user-groups',

	res: {
		type: types.array,
		optional: bool.false, nullable: bool.false,
		items: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			ref: 'UserGroup',
		}
	},
};

export default define(meta, async (ps, me) => {
	const joinings = await UserGroupJoinings.find({
		userId: me.id,
	});

	return await Promise.all(joinings.map(x => UserGroups.pack(x.userGroupId)));
});
