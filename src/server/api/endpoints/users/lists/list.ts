import UserList, { pack } from '../../../../../models/user-list';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': '自分の作成したユーザーリスト一覧を取得します。'
	},

	requireCredential: true,

	kind: 'account-read'
};

export default define(meta, (ps, me) => UserList.find({ userId: me._id })
	.then(x => Promise.all(x.map(pack))));
