import $ from 'cafy';
import define from '../../define';
import { Users } from '../../../../models';

export const meta = {
	requireCredential: false,

	tags: ['hashtags', 'users'],

	params: {
		tag: {
			validator: $.str,
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
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
		type: 'array',
		items: {
			type: 'User'
		}
	},
};

export default define(meta, async (ps, me) => {
	const query = Users.createQueryBuilder('user')
		.where(':tag = ANY(user.tags)', { tag: ps.tag });

	if (ps.state === 'alive') {
		query.andWhere('user.updatedAt > :date', { date: new Date(Date.now() - (1000 * 60 * 60 * 24 * 5)) });
	}

	if (ps.origin === 'local') {
		query.andWhere('user.host IS NULL');
	} else if (ps.origin === 'remote') {
		query.andWhere('user.host IS NOT NULL');
	}

	switch (ps.sort) {
		case '+follower': query.orderBy('followersCount', 'DESC'); break;
		case '-follower': query.orderBy('followersCount', 'ASC'); break;
		case '+createdAt': query.orderBy('createdAt', 'DESC'); break;
		case '-createdAt': query.orderBy('createdAt', 'ASC'); break;
		case '+updatedAt': query.orderBy('updatedAt', 'DESC'); break;
		case '-updatedAt': query.orderBy('updatedAt', 'ASC'); break;
	}

	const users = await query.take(ps.limit).getMany();

	return await Promise.all(users.map(user => Users.pack(user, me, { detail: true })));
});
