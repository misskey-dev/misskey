import $ from 'cafy';
import User, { pack } from '../../../models/user';
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

const mika: { [x: string]: any } = {
	'+follower': { followersCount: -1 },
	'-follower': { followersCount: 1 },
	'+createdAt': { createdAt: -1 },
	'-createdAt': { createdAt: 1 },
	'+updatedAt': { updatedAt: -1 },
	'-updatedAt': { updatedAt: 1 },
};

const rika = { _id: -1 };

export default define(meta, (ps, me) => User.find(
		ps.origin == 'local' ? { host: null } :
		ps.origin == 'remote' ? { host:
			{ $ne: null }
		} : {}, {
		limit: ps.limit,
		sort: mika[ps.sort] || rika,
		skip: ps.offset
	})
	.then(x => Promise.all(x.map(x => pack(x, me, { detail: true })))));
