import $ from 'cafy';
import User, { pack } from '../../../models/user';
import define from '../define';
import { fallback } from '../../../prelude/symbol';

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
			validator: $.str.optional.or([
				'+follower',
				'-follower',
				'+createdAt',
				'-createdAt',
				'+updatedAt',
				'-updatedAt',
			]),
		},

		origin: {
			validator: $.str.optional.or([
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

export default define(meta, (ps, me) => new Promise(async (res, rej) => {
	const q =
		ps.origin == 'local' ? { host: null } :
		ps.origin == 'remote' ? { host: { $ne: null } } :
		{};

	const users = await User
		.find(q, {
			limit: ps.limit,
			sort: sort[ps.sort] || sort[fallback],
			skip: ps.offset
		});

	res(await Promise.all(users.map(user => pack(user, me, { detail: true }))));
}));
