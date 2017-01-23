'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import App from '../../models/app';
import serialize from '../../serializers/app';

/**
 * Get my apps
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

	const query = {
		user_id: user._id
	};

	// Execute query
	const apps = await App
		.find(query, {
			limit: limit,
			skip: offset,
			sort: {
				_id: -1
			}
		});

	// Reply
	res(await Promise.all(apps.map(async app =>
		await serialize(app))));
});
