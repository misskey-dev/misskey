import define from '../../define.js';
import { Users } from '@/models/index.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';

export const meta = {
	requireCredential: false,

	tags: ['hashtags', 'users'],

	res: {
		type: 'array',
		optional: false, nullable: false,
		items: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserDetailed',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		tag: { type: 'string' },
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		sort: { type: 'string', enum: ['+follower', '-follower', '+createdAt', '-createdAt', '+updatedAt', '-updatedAt'] },
		state: { type: 'string', enum: ['all', 'alive'], default: "all" },
		origin: { type: 'string', enum: ['combined', 'local', 'remote'], default: "local" },
	},
	required: ['tag', 'sort'],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
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

	const users = await query.take(ps.limit).getMany();

	return await Users.packMany(users, me, { detail: true });
});
