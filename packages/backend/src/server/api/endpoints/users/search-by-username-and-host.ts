import define from '../../define.js';
import { Followings, Users } from '@/models/index.js';
import { Brackets } from 'typeorm';
import { USER_ACTIVE_THRESHOLD } from '@/const.js';
import { User } from '@/models/entities/user.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

	description: 'Search for a user by username and/or host.',

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'User',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		username: { type: 'string', nullable: true },
		host: { type: 'string', nullable: true },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		detail: { type: 'boolean', default: true },
	},
	anyOf: [
		{ required: ['username'] },
		{ required: ['host'] },
	],
} as const;

// TODO: avatar,bannerをJOINしたいけどエラーになる

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const activeThreshold = new Date(Date.now() - (1000 * 60 * 60 * 24 * 30)); // 30日

	if (ps.host) {
		const q = Users.createQueryBuilder('user')
			.where('user.isSuspended = FALSE')
			.andWhere('user.host LIKE :host', { host: ps.host.toLowerCase() + '%' });

		if (ps.username) {
			q.andWhere('user.usernameLower LIKE :username', { username: ps.username.toLowerCase() + '%' });
		}

		q.andWhere('user.updatedAt IS NOT NULL');
		q.orderBy('user.updatedAt', 'DESC');

		const users = await q.take(ps.limit).getMany();

		return await Users.packMany(users, me, { detail: ps.detail });
	} else if (ps.username) {
		let users: User[] = [];

		if (me) {
			const followingQuery = Followings.createQueryBuilder('following')
				.select('following.followeeId')
				.where('following.followerId = :followerId', { followerId: me.id });

			const query = Users.createQueryBuilder('user')
				.where(`user.id IN (${ followingQuery.getQuery() })`)
				.andWhere(`user.id != :meId`, { meId: me.id })
				.andWhere('user.isSuspended = FALSE')
				.andWhere('user.usernameLower LIKE :username', { username: ps.username.toLowerCase() + '%' })
				.andWhere(new Brackets(qb => { qb
					.where('user.updatedAt IS NULL')
					.orWhere('user.updatedAt > :activeThreshold', { activeThreshold: activeThreshold });
				}));

			query.setParameters(followingQuery.getParameters());

			users = await query
				.orderBy('user.usernameLower', 'ASC')
				.take(ps.limit)
				.getMany();

			if (users.length < ps.limit) {
				const otherQuery = await Users.createQueryBuilder('user')
					.where(`user.id NOT IN (${ followingQuery.getQuery() })`)
					.andWhere(`user.id != :meId`, { meId: me.id })
					.andWhere('user.isSuspended = FALSE')
					.andWhere('user.usernameLower LIKE :username', { username: ps.username.toLowerCase() + '%' })
					.andWhere('user.updatedAt IS NOT NULL');

				otherQuery.setParameters(followingQuery.getParameters());

				const otherUsers = await otherQuery
					.orderBy('user.updatedAt', 'DESC')
					.take(ps.limit - users.length)
					.getMany();

				users = users.concat(otherUsers);
			}
		} else {
			users = await Users.createQueryBuilder('user')
				.where('user.isSuspended = FALSE')
				.andWhere('user.usernameLower LIKE :username', { username: ps.username.toLowerCase() + '%' })
				.andWhere('user.updatedAt IS NOT NULL')
				.orderBy('user.updatedAt', 'DESC')
				.take(ps.limit - users.length)
				.getMany();
		}

		return await Users.packMany(users, me, { detail: !!ps.detail });
	}

	return [];
});
