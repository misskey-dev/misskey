import $ from 'cafy';
import AccessToken from '../../../../models/access-token';
import { pack } from '../../../../models/app';
import { ILocalUser } from '../../../../models/user';
import getParams from '../../get-params';

export const meta = {
	requireCredential: true,

	secure: true,

	params: {
		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10,
		},

		offset: {
			validator: $.num.optional.min(0),
			default: 0,
		},

		sort: {
			validator: $.str.optional.or('desc|asc'),
			default: 'desc',
		}
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

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

	res(await Promise.all(tokens.map(token => pack(token.appId, user, {
		detail: true
	}))));
});
