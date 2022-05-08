import { Users } from '@/models/index.js';
import define from '../../define.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,

	res: {
		type: 'array',
		nullable: false, optional: false,
		items: {
			type: 'object',
			nullable: false, optional: false,
			ref: 'UserDetailed',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		sort: { type: 'string', enum: ['+follower', '-follower', '+createdAt', '-createdAt', '+updatedAt', '-updatedAt'] },
		state: { type: 'string', enum: ['all', 'alive', 'available', 'admin', 'moderator', 'adminOrModerator', 'silenced', 'suspended'], default: 'all' },
		origin: { type: 'string', enum: ['combined', 'local', 'remote'], default: 'local' },
		username: { type: 'string', nullable: true, default: null },
		hostname: {
			type: 'string',
			nullable: true,
			default: null,
			description: 'The local host is represented with `null`.',
		},
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const query = Users.createQueryBuilder('user');

	switch (ps.state) {
		case 'available': query.where('user.isSuspended = FALSE'); break;
		case 'admin': query.where('user.isAdmin = TRUE'); break;
		case 'moderator': query.where('user.isModerator = TRUE'); break;
		case 'adminOrModerator': query.where('user.isAdmin = TRUE OR user.isModerator = TRUE'); break;
		case 'alive': query.where('user.updatedAt > :date', { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) }); break;
		case 'silenced': query.where('user.isSilenced = TRUE'); break;
		case 'suspended': query.where('user.isSuspended = TRUE'); break;
	}

	switch (ps.origin) {
		case 'local': query.andWhere('user.host IS NULL'); break;
		case 'remote': query.andWhere('user.host IS NOT NULL'); break;
	}

	if (ps.username) {
		query.andWhere('user.usernameLower like :username', { username: ps.username.toLowerCase() + '%' });
	}

	if (ps.hostname) {
		query.andWhere('user.host like :hostname', { hostname: '%' + ps.hostname.toLowerCase() + '%' });
	}

	switch (ps.sort) {
		case '+follower': query.orderBy('user.followersCount', 'DESC'); break;
		case '-follower': query.orderBy('user.followersCount', 'ASC'); break;
		case '+createdAt': query.orderBy('user.createdAt', 'DESC'); break;
		case '-createdAt': query.orderBy('user.createdAt', 'ASC'); break;
		case '+updatedAt': query.orderBy('user.updatedAt', 'DESC', 'NULLS LAST'); break;
		case '-updatedAt': query.orderBy('user.updatedAt', 'ASC', 'NULLS FIRST'); break;
		default: query.orderBy('user.id', 'ASC'); break;
	}

	query.take(ps.limit);
	query.skip(ps.offset);

	const users = await query.getMany();

	return await Users.packMany(users, me, { detail: true });
});
