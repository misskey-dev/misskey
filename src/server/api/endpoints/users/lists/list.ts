import UserList, { pack } from '../../../../../models/user-list';
import { ILocalUser } from '../../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '自分の作成したユーザーリスト一覧を取得します。'
	},

	requireCredential: true,

	kind: 'account-read'
};

export default async (params: any, me: ILocalUser) => new Promise(async (res, rej) => {
	// Fetch lists
	const userLists = await UserList.find({
		userId: me._id,
	});

	res(await Promise.all(userLists.map(x => pack(x))));
});
