import $ from 'cafy';
import define from '../../define';
import { Users } from '@/models/index';
import { Brackets } from 'typeorm';
import { USER_ACTIVE_THRESHOLD } from '@/const';

export const meta = {
	tags: ['users'],

	requireCredential: false as const,

	params: {
		username: {
			validator: $.optional.nullable.str,
		},

		host: {
			validator: $.optional.nullable.str,
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0,
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
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
	if (ps.host) {
		const q = Users.createQueryBuilder('user')
			.where('user.isSuspended = FALSE')
			.andWhere('user.host LIKE :host', { host: ps.host.toLowerCase() + '%' });

		if (ps.username) {
			q.andWhere('user.usernameLower like :username', { username: ps.username.toLowerCase() + '%' });
		}

		q.andWhere('user.updatedAt IS NOT NULL');
		q.orderBy('user.updatedAt', 'DESC');

		const users = await q.take(ps.limit!).skip(ps.offset).getMany();

		return await Users.packMany(users, me, { detail: ps.detail });
	} else if (ps.username) {
		let users = await Users.createQueryBuilder('user')
			.where('user.host IS NULL')
			.andWhere('user.isSuspended = FALSE')
			.andWhere('user.usernameLower like :username', { username: ps.username.toLowerCase() + '%' })
			.andWhere(new Brackets(qb => { qb
				.where('user.lastActiveDate IS NULL')
				.orWhere('user.lastActiveDate > :activeThreshold', { activeThreshold: new Date(Date.now() - USER_ACTIVE_THRESHOLD) });
			}))
			.orderBy('user.lastActiveDate', 'DESC', 'NULLS LAST')
			.take(ps.limit!)
			.skip(ps.offset)
			.getMany();

		if (users.length < ps.limit!) {
			const otherUsers = await Users.createQueryBuilder('user')
				.where('user.host IS NOT NULL')
				.andWhere('user.isSuspended = FALSE')
				.andWhere('user.usernameLower like :username', { username: ps.username.toLowerCase() + '%' })
				.andWhere('user.updatedAt IS NOT NULL')
				.orderBy('user.updatedAt', 'DESC')
				.take(ps.limit! - users.length)
				.getMany();

			users = users.concat(otherUsers);
		}

		return await Users.packMany(users, me, { detail: ps.detail });
	}
});
