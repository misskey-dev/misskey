import $ from 'cafy';
import User, { pack } from '../../../models/user';
import define from '../define';

export const meta = {
	requireCredential: false,

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

		origin: {
			validator: $.optional.str.or([
				'combined',
				'local',
				'remote',
			]),
			default: 'local'
		}
	}
};

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	let _sort;
	if (ps.sort) {
		if (ps.sort == '+follower') {
			_sort = {
				followersCount: -1
			};
		} else if (ps.sort == '-follower') {
			_sort = {
				followersCount: 1
			};
		} else if (ps.sort == '+createdAt') {
			_sort = {
				createdAt: -1
			};
		} else if (ps.sort == '+updatedAt') {
			_sort = {
				updatedAt: -1
			};
		} else if (ps.sort == '-createdAt') {
			_sort = {
				createdAt: 1
			};
		} else if (ps.sort == '-updatedAt') {
			_sort = {
				updatedAt: 1
			};
		}
	} else {
		_sort = {
			_id: -1
		};
	}

	const q =
		ps.origin == 'local' ? { host: null } :
		ps.origin == 'remote' ? { host: { $ne: null } } :
		{};

	const users = await User
		.find(q, {
			limit: ps.limit,
			sort: _sort,
			skip: ps.offset
		});

	res(await Promise.all(users.map(user => pack(user, me, { detail: true }))));
}));
