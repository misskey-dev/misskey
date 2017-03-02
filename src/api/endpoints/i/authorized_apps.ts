'use strict';

/**
 * Module dependencies
 */
import it from '../../it';
import AccessToken from '../../models/access-token';
import serialize from '../../serializers/app';

/**
 * Get authorized apps of my account
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) =>
	new Promise(async (res, rej) =>
{
	// Get 'limit' parameter
	const [limit, limitErr] = it(params.limit).expect.number().range(1, 100).default(10).qed();
	if (limitErr) return rej('invalid limit param');

	// Get 'offset' parameter
	const [offset, offsetErr] = it(params.offset).expect.number().min(0).default(0).qed();
	if (offsetErr) return rej('invalid offset param');

	// Get 'sort' parameter
	const [sort, sortError] = it(params.sort).expect.string().or('desc asc').default('desc').qed();
	if (sortError) return rej('invalid sort param');

	// Get tokens
	const tokens = await AccessToken
		.find({
			user_id: user._id
		}, {
			limit: limit,
			skip: offset,
			sort: {
				_id: sort == 'asc' ? 1 : -1
			}
		});

	// Serialize
	res(await Promise.all(tokens.map(async token =>
		await serialize(token.app_id))));
});
