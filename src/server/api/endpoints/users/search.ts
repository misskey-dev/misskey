import $ from 'cafy';
import define from '../../define';
import { UserProfiles, Users } from '@/models/index';
import { User } from '@/models/entities/user';
import { Brackets } from 'typeorm';
import { USER_ACTIVE_THRESHOLD } from '@/const';

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

		scope: {
			validator: $.optional.str.or(['local', 'remote', 'both']),
			default: 'both',
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
		}
	},
};

export default define(meta, async (ps, me) => {
	const isUsername = ps.query.startsWith('@');

	let users: User[] = [];

	if (isUsername) {
		const usernameQuery = Users.createQueryBuilder('user')
			.where('user.usernameLower like :username', { username: ps.query.replace('@', '').toLowerCase() + '%' })
			.andWhere(new Brackets(qb => { qb
				.where('user.lastActiveDate IS NULL')
				.orWhere('user.lastActiveDate > :activeThreshold', { activeThreshold: new Date(Date.now() - USER_ACTIVE_THRESHOLD) });
			}))
			.andWhere('user.isSuspended = FALSE');

		if (ps.scope === 'local') {
			usernameQuery
				.andWhere('user.host IS NULL')
				.orderBy('user.lastActiveDate', 'DESC', 'NULLS LAST');
		} else if (ps.scope === 'remote') {
			usernameQuery
				.andWhere('user.host IS NOT NULL')
				.orderBy('user.updatedAt', 'DESC', 'NULLS LAST');
		} else { // both
			usernameQuery
				.orderBy('user.updatedAt', 'DESC', 'NULLS LAST');
		}

		users = await usernameQuery
			.take(ps.limit!)
			.skip(ps.offset)
			.getMany();
	} else {
		const nameQuery = Users.createQueryBuilder('user')
			.where('user.name ilike :query', { query: '%' + ps.query + '%' })
			.andWhere(new Brackets(qb => { qb
				.where('user.lastActiveDate IS NULL')
				.orWhere('user.lastActiveDate > :activeThreshold', { activeThreshold: new Date(Date.now() - USER_ACTIVE_THRESHOLD) });
			}))
			.andWhere('user.isSuspended = FALSE');

		if (ps.scope === 'local') {
			nameQuery
				.andWhere('user.host IS NULL')
				.orderBy('user.lastActiveDate', 'DESC', 'NULLS LAST');
		} else if (ps.scope === 'remote') {
			nameQuery
				.andWhere('user.host IS NOT NULL')
				.orderBy('user.updatedAt', 'DESC', 'NULLS LAST');
		} else { // both
			nameQuery
				.orderBy('user.updatedAt', 'DESC', 'NULLS LAST');
		}

		users = await nameQuery
			.take(ps.limit!)
			.skip(ps.offset)
			.getMany();

		if (users.length < ps.limit!) {
			const profQuery = UserProfiles.createQueryBuilder('prof')
				.select('prof.userId')
				.where('prof.description ilike :query', { query: '%' + ps.query + '%' });

			if (ps.scope === 'local') {
				profQuery.andWhere('prof.userHost IS NULL');
			} else if (ps.scope === 'remote') {
				profQuery.andWhere('prof.userHost IS NOT NULL');
			}

			const query = Users.createQueryBuilder('user')
				.where(`user.id IN (${ profQuery.getQuery() })`)
				.andWhere(new Brackets(qb => { qb
					.where('user.lastActiveDate IS NULL')
					.orWhere('user.lastActiveDate > :activeThreshold', { activeThreshold: new Date(Date.now() - USER_ACTIVE_THRESHOLD) });
				}))
				.andWhere('user.isSuspended = FALSE')
				.setParameters(profQuery.getParameters());

			if (ps.scope === 'local') {
				query.orderBy('user.lastActiveDate', 'DESC', 'NULLS LAST');
			} else if (ps.scope === 'remote') {
				query.orderBy('user.updatedAt', 'DESC', 'NULLS LAST');
			} else { // both
				query.orderBy('user.updatedAt', 'DESC', 'NULLS LAST');
			}

			users = users.concat(await query
				.take(ps.limit!)
				.skip(ps.offset)
				.getMany()
			);
		}
	}

	return await Users.packMany(users, me, { detail: ps.detail });
});
