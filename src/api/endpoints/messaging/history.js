'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
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
	let limit = params.limit;
	if (limit !== undefined && limit !== null) {
		limit = parseInt(limit, 10);

		// From 1 to 100
		if (!(1 <= limit && limit <= 100)) {
			return rej('invalid limit range');
		}
	} else {
		limit = 10;
	}

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
