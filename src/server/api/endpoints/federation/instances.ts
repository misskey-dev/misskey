import $ from 'cafy';
import define from '../../define';
import { Instances } from '../../../../models';
import fetchMeta from '../../../../misc/fetch-meta';

export const meta = {
	tags: ['federation'],

	requireCredential: false,

	params: {
		blocked: {
			validator: $.optional.nullable.bool,
		},

		notResponding: {
			validator: $.optional.nullable.bool,
		},

		markedAsClosed: {
			validator: $.optional.nullable.bool,
		},

		limit: {
			validator: $.optional.num.range(1, 100),
			default: 30
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0
		},

		sort: {
			validator: $.optional.str,
		}
	}
};

export default define(meta, async (ps, me) => {
	const query = Instances.createQueryBuilder('instance');

	switch (ps.sort) {
		case '+notes': query.orderBy('notesCount', 'DESC'); break;
		case '-notes': query.orderBy('notesCount', 'ASC'); break;
		case '+usersCount': query.orderBy('usersCount', 'DESC'); break;
		case '-usersCount': query.orderBy('usersCount', 'ASC'); break;
		case '+followingCount': query.orderBy('followingCount', 'DESC'); break;
		case '-followingCount': query.orderBy('followingCount', 'ASC'); break;
		case '+followersCount': query.orderBy('followersCount', 'DESC'); break;
		case '-followersCount': query.orderBy('followersCount', 'ASC'); break;
		case '+caughtAt': query.orderBy('caughtAt', 'DESC'); break;
		case '-caughtAt': query.orderBy('caughtAt', 'ASC'); break;
		case '+lastCommunicatedAt': query.orderBy('lastCommunicatedAt', 'DESC'); break;
		case '-lastCommunicatedAt': query.orderBy('lastCommunicatedAt', 'ASC'); break;
		case '+driveUsage': query.orderBy('driveUsage', 'DESC'); break;
		case '-driveUsage': query.orderBy('driveUsage', 'ASC'); break;
		case '+driveFiles': query.orderBy('driveFiles', 'DESC'); break;
		case '-driveFiles': query.orderBy('driveFiles', 'ASC'); break;

		default: query.orderBy('id', 'DESC'); break;
	}

	if (typeof ps.blocked === 'boolean') {
		const meta = await fetchMeta();
		if (ps.blocked) {
			query.andWhere('instance.host IN (:...blocks)', { blocks: meta.blockedHosts });
		} else {
			query.andWhere('instance.host NOT IN (:...blocks)', { blocks: meta.blockedHosts });
		}
	}

	if (typeof ps.notResponding === 'boolean') {
		if (ps.notResponding) {
			query.andWhere('instance.isNotResponding = TRUE');
		} else {
			query.andWhere('instance.isNotResponding = FALSE');
		}
	}

	if (typeof ps.markedAsClosed === 'boolean') {
		if (ps.markedAsClosed) {
			query.andWhere('instance.isMarkedAsClosed = TRUE');
		} else {
			query.andWhere('instance.isMarkedAsClosed = FALSE');
		}
	}

	const instances = await query.take(ps.limit).skip(ps.offset).getMany();

	return instances;
});
