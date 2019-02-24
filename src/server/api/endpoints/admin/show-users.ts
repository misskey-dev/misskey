import $ from 'cafy';
import User, { pack } from '../../../../models/user';
import define from '../../define';
import { fallback } from '../../../../prelude/symbol';

export const meta = {
	tags: ['admin'],

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

const sort: any = { // < https://github.com/Microsoft/TypeScript/issues/1863
	'+follower': { followersCount: -1 },
	'-follower': { followersCount: 1 },
	'+createdAt': { createdAt: -1 },
	'-createdAt': { createdAt: 1 },
	'+updatedAt': { updatedAt: -1 },
	'-updatedAt': { updatedAt: 1 },
	[fallback]: { _id: -1 }
};

export default define(meta, async (ps, me) => {
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
			sort: sort[ps.sort] || sort[fallback],
			skip: ps.offset
		});

	return await Promise.all(users.map(user => pack(user, me, { detail: true })));
});
