import $ from 'cafy';
import define from '../../define';
import { AccessTokens, Apps } from '../../../../models';

export const meta = {
	requireCredential: true as const,

	secure: true,

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10,
		},

		offset: {
			validator: $.optional.num.min(0),
			default: 0,
		},

		sort: {
			validator: $.optional.str.or('desc|asc'),
			default: 'desc',
		}
	}
};

export default define(meta, async (ps, user) => {
	// Get tokens
	const tokens = await AccessTokens.find({
		where: {
			userId: user.id
		},
		take: ps.limit!,
		skip: ps.offset,
		order: {
			id: ps.sort == 'asc' ? 1 : -1
		}
	});

	return await Promise.all(tokens.map(token => Apps.pack(token.appId, user, {
		detail: true
	})));
});
