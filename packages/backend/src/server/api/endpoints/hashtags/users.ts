import $ from 'cafy';
import define from '../../define';
import { Users } from '@/models/index';
import { normalizeForSearch } from '@/misc/normalize-for-search';

export const meta = {
	requireCredential: false as const,

	tags: ['hashtags', 'users'],

	params: {
		tag: {
			validator: $.str,
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},

		sort: {
			validator: $.str.or([
				'+follower',
				'-follower',
				'+createdAt',
				'-createdAt',
				'+updatedAt',
				'-updatedAt',
			]),
		},

		state: {
			validator: $.optional.str.or([
				'all',
				'alive',
			]),
			default: 'all',
		},

		origin: {
			validator: $.optional.str.or([
				'combined',
				'local',
				'remote',
			]),
			default: 'local',
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
	const query = Users.createQueryBuilder('user')
		.where(':tag = ANY(user.tags)', { tag: normalizeForSearch(ps.tag) });

	const recent = new Date(Date.now() - (1000 * 60 * 60 * 24 * 5));

	if (ps.state === 'alive') {
		query.andWhere('user.updatedAt > :date', { date: recent });
	}

	if (ps.origin === 'local') {
		query.andWhere('user.host IS NULL');
	} else if (ps.origin === 'remote') {
		query.andWhere('user.host IS NOT NULL');
	}

	switch (ps.sort) {
		case '+follower': query.orderBy('user.followersCount', 'DESC'); break;
		case '-follower': query.orderBy('user.followersCount', 'ASC'); break;
		case '+createdAt': query.orderBy('user.createdAt', 'DESC'); break;
		case '-createdAt': query.orderBy('user.createdAt', 'ASC'); break;
		case '+updatedAt': query.orderBy('user.updatedAt', 'DESC'); break;
		case '-updatedAt': query.orderBy('user.updatedAt', 'ASC'); break;
	}

	const users = await query.take(ps.limit!).getMany();

	return await Users.packMany(users, me, { detail: true });
});
