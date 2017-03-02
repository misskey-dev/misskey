'use strict';

/**
 * Module dependencies
 */
import it from '../../it';
import History from '../../models/messaging-history';
import serialize from '../../serializers/messaging-message';

/**
 * Show messaging history
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

	// Get history
	const history = await History
		.find({
			user_id: user._id
		}, {
			limit: limit,
			sort: {
				updated_at: -1
			}
		});

	// Serialize
	res(await Promise.all(history.map(async h =>
		await serialize(h.message, user))));
});
