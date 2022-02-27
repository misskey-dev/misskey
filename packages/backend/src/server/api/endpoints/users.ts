import define from '../define.js';
import { Users } from '@/models/index.js';
import { generateMutedUserQueryForUsers } from '../common/generate-muted-user-query.js';
import { generateBlockQueryForUsers } from '../common/generate-block-query.js';

export const meta = {
	tags: ['users'],

	requireCredential: false,

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
		limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
		offset: { type: 'integer', default: 0 },
		sort: { type: 'string', enum: ['+follower', '-follower', '+createdAt', '-createdAt', '+updatedAt', '-updatedAt'] },
		state: { type: 'string', enum: ['all', 'admin', 'moderator', 'adminOrModerator', 'alive'], default: "all" },
		origin: { type: 'string', enum: ['combined', 'local', 'remote'], default: "local" },
	},
	required: [],
} as const;

// eslint-disable-next-line import/no-default-export
export default define(meta, paramDef, async (ps, me) => {
	const query = Users.createQueryBuilder('user');
	query.where('user.isExplorable = TRUE');

	switch (ps.state) {
		case 'admin': query.andWhere('user.isAdmin = TRUE'); break;
		case 'moderator': query.andWhere('user.isModerator = TRUE'); break;
		case 'adminOrModerator': query.andWhere('user.isAdmin = TRUE OR user.isModerator = TRUE'); break;
		case 'alive': query.andWhere('user.updatedAt > :date', { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) }); break;
	}

	switch (ps.origin) {
		case 'local': query.andWhere('user.host IS NULL'); break;
		case 'remote': query.andWhere('user.host IS NOT NULL'); break;
	}

	switch (ps.sort) {
		case '+follower': query.orderBy('user.followersCount', 'DESC'); break;
		case '-follower': query.orderBy('user.followersCount', 'ASC'); break;
		case '+createdAt': query.orderBy('user.createdAt', 'DESC'); break;
		case '-createdAt': query.orderBy('user.createdAt', 'ASC'); break;
		case '+updatedAt': query.andWhere('user.updatedAt IS NOT NULL').orderBy('user.updatedAt', 'DESC'); break;
		case '-updatedAt': query.andWhere('user.updatedAt IS NOT NULL').orderBy('user.updatedAt', 'ASC'); break;
		default: query.orderBy('user.id', 'ASC'); break;
	}

	if (me) generateMutedUserQueryForUsers(query, me);
	if (me) generateBlockQueryForUsers(query, me);

	query.take(ps.limit);
	query.skip(ps.offset);

	const users = await query.getMany();

	return await Users.packMany(users, me, { detail: true });
});
