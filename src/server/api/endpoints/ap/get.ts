import $ from 'cafy';
import define from '../../define';
import Resolver from '@/remote/activitypub/resolver';
import { ApiError } from '../../error';

export const meta = {
	tags: ['federation'],

	requireCredential: false as const,

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
