import $ from 'cafy';
import User, { pack } from '../../../../models/user';
import define from '../../define';

export const meta = {
	requireCredential: true,
	requireModerator: true,

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
				'verified',
				'silenced',
				'suspended',
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

	const q = {
		$and: []
	} as any;

	// state
	q.$and.push(
		ps.state == 'admin' ? { isAdmin: true } :
		ps.state == 'moderator' ? { isModerator: true } :
		ps.state == 'adminOrModerator' ? {
			$or: [{
				isAdmin: true
			}, {
				isModerator: true
			}]
		} :
		ps.state == 'verified' ? { isVerified: true } :
		ps.state == 'silenced' ? { isSilenced: true } :
		ps.state == 'suspended' ? { isSuspended: true } :
		{}
	);

	// origin
	q.$and.push(
		ps.origin == 'local' ? { host: null } :
		ps.origin == 'remote' ? { host: { $ne: null } } :
		{}
	);

	const users = await User
		.find(q, {
			limit: ps.limit,
			sort: _sort,
			skip: ps.offset
		});

	res(await Promise.all(users.map(user => pack(user, me, { detail: true }))));
}));
