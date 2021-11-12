import $ from 'cafy';
import define from '../../define';
import Resolver from '@/remote/activitypub/resolver';
import { ApiError } from '../../error';
import ms from 'ms';

export const meta = {
	tags: ['federation'],

	requireCredential: true as const,

	limit: {
		duration: ms('1hour'),
		max: 30
	},

	params: {
		uri: {
			validator: $.str,
		},
	},

	errors: {
	},

	res: {
		type: 'object' as const,
		optional: false as const, nullable: false as const,
	}
};

export default define(meta, async (ps) => {
	const resolver = new Resolver();
	const object = await resolver.resolve(ps.uri);
	return object;
});
