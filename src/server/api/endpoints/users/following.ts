import $ from 'cafy';
import ID, { transform } from '../../../../misc/cafy-id';
import User from '../../../../models/user';
import Following from '../../../../models/following';
import { pack } from '../../../../models/user';
import { getFriendIds } from '../../common/get-friends';
import define from '../../define';

export const meta = {
	desc: {
		'ja-JP': '指定したユーザーのフォロー一覧を取得します。',
		'en-US': 'Get following users of a user.'
	},

	requireCredential: false,

	params: {
		userId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のユーザーのID',
				'en-US': 'Target user ID'
			}
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		cursor: {
			validator: $.optional.type(ID),
			default: null as any,
			transform: transform,
		},

		iknow: {
			validator: $.optional.bool,
			default: false,
		}
	}
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	// Lookup user
	const user = await User.findOne({
		_id: ps.userId
	}, {
		fields: {
			_id: true
		}
	});

	if (user === null) {
		return rej('user not found');
	}

	// Construct query
	const query = {
		followerId: user._id
	} as any;

	// ログインしていてかつ iknow フラグがあるとき
	if (me && ps.iknow) {
		// Get my friends
		const myFriends = await getFriendIds(me._id);

		query.followeeId = {
			$in: myFriends
		};
	}

	// カーソルが指定されている場合
	if (ps.cursor) {
		query._id = {
			$lt: ps.cursor
		};
	}

	// Get followers
	const following = await Following
		.find(query, {
			limit: ps.limit + 1,
			sort: { _id: -1 }
		});

	// 「次のページ」があるかどうか
	const inStock = following.length === ps.limit + 1;
	if (inStock) {
		following.pop();
	}

	const users = await Promise.all(following.map(f => pack(f.followeeId, me, { detail: true })));

	res({
		users: users,
		next: inStock ? following[following.length - 1]._id : null,
	});
}));
