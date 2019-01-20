import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import User, { ILocalUser } from '../../../../models/user';
import Following from '../../../../models/following';
import { pack } from '../../../../models/user';
import { getFriendIds } from '../../common/get-friends';
import define from '../../define';
import { error } from '../../../../prelude/promise';
import { query } from '../../../../prelude/query';

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
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		cursor: {
			validator: $.type(ID).optional,
			default: null as any,
			transform: transform,
		},

		iknow: {
			validator: $.bool.optional,
			default: false,
		}
	}
};

const be = async (my: ILocalUser, baby: boolean) =>
	my && baby ? { $in: await getFriendIds(my._id) } : undefined;

export default define(meta, (ps, me) => User.findOne({ _id: ps.userId }, {
		fields: { _id: true }
	})
	.then(x =>
		x === null ? error('user not found') :
		be(me, ps.iknow)
			.then($in => Following.find(query({
					_id: ps.cursor ? { $lt: ps.cursor } : undefined,
					followeeId: $in,
					followerId: x._id
				}), {
					limit: ps.limit + 1,
					sort: { _id: -1 }
				})
			.then(x => {
				const inStock = x.length === ps.limit + 1;
				(inStock && x.pop(), Promise.all(x.map(f => pack(f.followeeId, me, { detail: true }))))
					.then(users => ({
						users,
						next: inStock ? x[x.length - 1]._id : null,
					}));
			}))));
