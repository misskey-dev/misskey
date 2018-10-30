import $ from 'cafy'; import ID from '../../../../misc/cafy-id';
import Blocking from '../../../../models/blocking';
import { pack, ILocalUser } from '../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': 'ブロックしているユーザー一覧を取得します。',
		'en-US': 'Get blocking users.'
	},

	requireCredential: true,

	kind: 'following-read'
};

export default (params: any, me: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 30, limitErr] = $.num.optional.range(1, 100).get(params.limit);
	if (limitErr) return rej('invalid limit param');

	// Get 'cursor' parameter
	const [cursor = null, cursorErr] = $.type(ID).optional.get(params.cursor);
	if (cursorErr) return rej('invalid cursor param');

	// Construct query
	const query = {
		blockerId: me._id
	} as any;

	// カーソルが指定されている場合
	if (cursor) {
		query._id = {
			$lt: cursor
		};
	}

	// Get blockings
	const blockings = await Blocking
		.find(query, {
			limit: limit + 1,
			sort: { _id: -1 }
		});

	// 「次のページ」があるかどうか
	const inStock = blockings.length === limit + 1;
	if (inStock) {
		blockings.pop();
	}

	// Serialize
	const users = await Promise.all(blockings.map(async m =>
		await pack(m.blockeeId, me, { detail: true })));

	// Response
	res({
		users: users,
		next: inStock ? blockings[blockings.length - 1]._id : null,
	});
});
