'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import AccessToken from '../../models/access-token';
import serialize from '../../serializers/app';

/**
 * Get authorized apps of my account
 *
 * @param {Object} params
 * @param {Object} user
 * @return {Promise<object>}
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

	// Get 'offset' parameter
	let offset = params.offset;
	if (offset !== undefined && offset !== null) {
		offset = parseInt(offset, 10);
	} else {
		offset = 0;
	}

	// Get 'sort' parameter
	let sort = params.sort || 'desc';

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
