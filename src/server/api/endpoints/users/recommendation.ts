import * as ms from 'ms';
import $ from 'cafy';
import { getFriendIds } from '../../common/get-friends';
import define from '../../define';
import { getHideUserIds } from '../../common/get-hide-users';
import { Users } from '../../../../models';
import { In, Not, MoreThanOrEqual } from 'typeorm';

export const meta = {
	desc: {
		'ja-JP': 'おすすめのユーザー一覧を取得します。'
	},

	tags: ['users'],

	requireCredential: true,

	kind: 'account-read',

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
		}
	},

	res: {
		type: 'array',
		items: {
			type: 'User',
		}
	},
};

export default define(meta, async (ps, me) => {
	// ID list of the user itself and other users who the user follows
	const followingIds = await getFriendIds(me.id);

	// 隠すユーザーを取得
	const hideUserIds = await getHideUserIds(me);

	const users = await Users.find({
		where: {
			id: Not(In(followingIds.concat(hideUserIds))),
			isLocked: false,
			updatedAt: MoreThanOrEqual(new Date(Date.now() - ms('7days'))),
			host: null
		},
		take: ps.limit,
		skip: ps.offset,
		order: {
			followersCount: -1
		}
	});

	return await Promise.all(users.map(user => Users.pack(user, me, { detail: true })));
});
