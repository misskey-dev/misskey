/**
 * Module dependencies
 */
import $ from 'cafy';
import History from '../../models/messaging-history';
import serialize from '../../serializers/messaging-message';

/**
 * Show messaging history
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
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
