import $ from 'cafy';
import define from '../../define';
import { Users } from '../../../../models';
import { User } from '../../../../models/entities/user';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーを検索します。'
	},

	tags: ['users'],

	requireCredential: false as const,

	params: {
		username: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'クエリ'
			}
		},

		host: {
			validator: $.optional.nullable.str,
			desc: {
				'ja-JP': 'クエリ'
			}
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0,
			desc: {
				'ja-JP': 'オフセット'
			}
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
			desc: {
				'ja-JP': '取得する数'
			}
		},

		detail: {
			validator: $.optional.bool,
			default: true,
			desc: {
				'ja-JP': '詳細なユーザー情報を含めるか否か'
			}
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'User',
		}
	},
};

export default define(meta, async (ps, me) => {
	if (ps.host) {
		const q = Users.createQueryBuilder('user')
			.where('user.isSuspended = FALSE')
			.andWhere('user.host LIKE :host', { host: ps.host.toLowerCase() + '%' });

		if (ps.username) {
			q.andWhere('user.usernameLower like :username', { username: ps.username.toLowerCase() + '%' })
		}

		const users = await q.take(ps.limit!).skip(ps.offset).getMany();

		return await Users.packMany(users, me, { detail: ps.detail });
	} else {
		let users = await Users.createQueryBuilder('user')
			.where('user.host IS NULL')
			.andWhere('user.isSuspended = FALSE')
			.andWhere('user.usernameLower like :username', { username: ps.username.toLowerCase() + '%' })
			.take(ps.limit!)
			.skip(ps.offset)
			.getMany();

		if (users.length < ps.limit!) {
			const otherUsers = await Users.createQueryBuilder('user')
				.where('user.host IS NOT NULL')
				.andWhere('user.isSuspended = FALSE')
				.andWhere('user.usernameLower like :username', { username: ps.username.toLowerCase() + '%' })
				.take(ps.limit! - users.length)
				.getMany();

			users = users.concat(otherUsers);
		}

		return await Users.packMany(users, me, { detail: ps.detail });
	}
});
