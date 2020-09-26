import $ from 'cafy';
import define from '../define';
import { Users } from '../../../models';
import { generateMutedUserQueryForUsers } from '../common/generate-muted-user-query';

export const meta = {
	tags: ['users'],

	requireCredential: false as const,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
		},

		sort: {
			validator: $.optional.str.or([
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
				'admin',
				'moderator',
				'adminOrModerator',
				'alive'
			]),
			default: 'all'
		},

		origin: {
			validator: $.optional.str.or([
				'combined',
				'local',
				'remote',
			]),
			default: 'local'
		}
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
	const query = Users.createQueryBuilder('user');

	switch (ps.state) {
		case 'admin': query.where('user.isAdmin = TRUE'); break;
		case 'moderator': query.where('user.isModerator = TRUE'); break;
		case 'adminOrModerator': query.where('user.isAdmin = TRUE OR isModerator = TRUE'); break;
		case 'alive': query.where('user.updatedAt > :date', { date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5) }); break;
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

	query.take(ps.limit!);
	query.skip(ps.offset);

	const users = await query.getMany();

	return await Users.packMany(users, me, { detail: true });
});
