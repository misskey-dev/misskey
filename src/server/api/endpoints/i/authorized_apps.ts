import $ from 'cafy';
import AccessToken from '../../../../models/access-token';
import { pack } from '../../../../models/app';
import define from '../../define';

export const meta = {
	requireCredential: true,

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
	const tokens = await AccessToken
		.find({
			userId: user._id
		}, {
			limit: ps.limit,
			skip: ps.offset,
			sort: {
				_id: ps.sort == 'asc' ? 1 : -1
			}
		});

	return await Promise.all(tokens.map(token => pack(token.appId, user, {
		detail: true
	})));
});
