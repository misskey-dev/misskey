import $ from 'cafy';
import User, { pack, ILocalUser } from '../../../models/user';
import define from '../define';

export const meta = {
	requireCredential: false,

	params: {
		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		offset: {
			validator: $.num.optional.min(0),
			default: 0
		},

		sort: {
			validator: $.str.optional.or('+follower|-follower'),
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
		}
	} else {
		_sort = {
			_id: -1
		};
	}

	const users = await User
		.find({
			host: null
		}, {
			limit: ps.limit,
			sort: _sort,
			skip: ps.offset
		});

	res(await Promise.all(users.map(user => pack(user, me))));
}));
