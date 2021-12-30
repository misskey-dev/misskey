import $ from 'cafy';
import define from '../../define';
import { UserProfiles, Users } from '@/models/index';
import { User } from '@/models/entities/user';
import { Brackets } from 'typeorm';

export const meta = {
	tags: ['users'],

	requireCredential: false as const,

	params: {
		query: {
			validator: $.str,
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0,
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},

		origin: {
			validator: $.optional.str.or(['local', 'remote', 'combined']),
			default: 'combined',
		},

		detail: {
			validator: $.optional.bool,
			default: true,
		},
	},

	res: {
		type: 'array' as const,
		optional: false as const, nullable: false as const,
		items: {
			type: 'object' as const,
			optional: false as const, nullable: false as const,
			ref: 'User',
		},
	},
};

export default define(meta, async (ps, me) => {
	const activeThreshold = new Date(Date.now() - (1000 * 60 * 60 * 24 * 30)); // 30日

	const isUsername = ps.query.startsWith('@');

	let users: User[] = [];

	if (isUsername) {
		const usernameQuery = Users.createQueryBuilder('user')
			.where('user.usernameLower LIKE :username', { username: ps.query.replace('@', '').toLowerCase() + '%' })
			.andWhere(new Brackets(qb => { qb
				.where('user.updatedAt IS NULL')
				.orWhere('user.updatedAt > :activeThreshold', { activeThreshold: activeThreshold });
			}))
			.andWhere('user.isSuspended = FALSE');

		if (ps.origin === 'local') {
			usernameQuery.andWhere('user.host IS NULL');
		} else if (ps.origin === 'remote') {
			usernameQuery.andWhere('user.host IS NOT NULL');
		}

		users = await usernameQuery
			.orderBy('user.updatedAt', 'DESC', 'NULLS LAST')
			.take(ps.limit!)
			.skip(ps.offset)
			.getMany();
	} else {
		const nameQuery = Users.createQueryBuilder('user')
			.where('user.name ILIKE :query', { query: '%' + ps.query + '%' })
			.andWhere(new Brackets(qb => { qb
				.where('user.updatedAt IS NULL')
				.orWhere('user.updatedAt > :activeThreshold', { activeThreshold: activeThreshold });
			}))
			.andWhere('user.isSuspended = FALSE');

		if (ps.origin === 'local') {
			nameQuery.andWhere('user.host IS NULL');
		} else if (ps.origin === 'remote') {
			nameQuery.andWhere('user.host IS NOT NULL');
		}

		users = await nameQuery
			.orderBy('user.updatedAt', 'DESC', 'NULLS LAST')
			.take(ps.limit!)
			.skip(ps.offset)
			.getMany();

		if (users.length < ps.limit!) {
			const profQuery = UserProfiles.createQueryBuilder('prof')
				.select('prof.userId')
				.where('prof.description ILIKE :query', { query: '%' + ps.query + '%' });

			if (ps.origin === 'local') {
				profQuery.andWhere('prof.userHost IS NULL');
			} else if (ps.origin === 'remote') {
				profQuery.andWhere('prof.userHost IS NOT NULL');
			}

			const query = Users.createQueryBuilder('user')
				.where(`user.id IN (${ profQuery.getQuery() })`)
				.andWhere(new Brackets(qb => { qb
					.where('user.updatedAt IS NULL')
					.orWhere('user.updatedAt > :activeThreshold', { activeThreshold: activeThreshold });
				}))
				.andWhere('user.isSuspended = FALSE')
				.setParameters(profQuery.getParameters());

			users = users.concat(await query
				.orderBy('user.updatedAt', 'DESC', 'NULLS LAST')
				.take(ps.limit!)
				.skip(ps.offset)
				.getMany()
			);
		}
	}

	return await Users.packMany(users, me, { detail: ps.detail });
});
