import $ from 'cafy';
import define from '../../define';
import { UserProfiles, Users } from '../../../../models';
import { User } from '../../../../models/entities/user';

export const meta = {
	desc: {
		'ja-JP': 'ユーザーを検索します。'
	},

	tags: ['users'],

	requireCredential: false as const,

	params: {
		query: {
			validator: $.str,
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

		localOnly: {
			validator: $.optional.bool,
			default: false,
			desc: {
				'ja-JP': 'ローカルユーザーのみ検索対象にするか否か'
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
	const isUsername = ps.query.startsWith('@');

	let users: User[] = [];

	if (isUsername) {
		users = await Users.createQueryBuilder('user')
			.where('user.host IS NULL')
			.andWhere('user.isSuspended = FALSE')
			.andWhere('user.usernameLower like :username', { username: ps.query.replace('@', '').toLowerCase() + '%' })
			.andWhere('user.updatedAt IS NOT NULL')
			.orderBy('user.updatedAt', 'DESC')
			.take(ps.limit!)
			.skip(ps.offset)
			.getMany();

		if (users.length < ps.limit! && !ps.localOnly) {
			const otherUsers = await Users.createQueryBuilder('user')
				.where('user.host IS NOT NULL')
				.andWhere('user.isSuspended = FALSE')
				.andWhere('user.usernameLower like :username', { username: ps.query.replace('@', '').toLowerCase() + '%' })
				.andWhere('user.updatedAt IS NOT NULL')
				.orderBy('user.updatedAt', 'DESC')
				.take(ps.limit! - users.length)
				.getMany();

			users = users.concat(otherUsers);
		}
	} else {
		const profQuery = UserProfiles.createQueryBuilder('prof')
			.select('prof.userId')
			.where('prof.userHost IS NULL')
			.andWhere('prof.description ilike :query', { query: '%' + ps.query + '%' });

		users = await Users.createQueryBuilder('user')
			.where(`user.id IN (${ profQuery.getQuery() })`)
			.setParameters(profQuery.getParameters())
			.andWhere('user.updatedAt IS NOT NULL')
			.orderBy('user.updatedAt', 'DESC')
			.take(ps.limit!)
			.skip(ps.offset)
			.getMany();

		if (users.length < ps.limit! && !ps.localOnly) {
			const profQuery2 = UserProfiles.createQueryBuilder('prof')
				.select('prof.userId')
				.where('prof.userHost IS NOT NULL')
				.andWhere('prof.description ilike :query', { query: '%' + ps.query + '%' });

			const otherUsers = await Users.createQueryBuilder('user')
				.where(`user.id IN (${ profQuery2.getQuery() })`)
				.setParameters(profQuery2.getParameters())
				.andWhere('user.updatedAt IS NOT NULL')
				.orderBy('user.updatedAt', 'DESC')
				.take(ps.limit! - users.length)
				.getMany();

			users = users.concat(otherUsers);
		}
	}

	return await Users.packMany(users, me, { detail: ps.detail });
});
