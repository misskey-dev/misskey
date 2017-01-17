'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import Signin from '../../models/signin';
import serialize from '../../serializers/signin';

/**
 * Get signin history of my account
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

	const since = params.since_id || null;
	const max = params.max_id || null;

	// Check if both of since_id and max_id is specified
	if (since !== null && max !== null) {
		return rej('cannot set since_id and max_id');
	}

	const query = {
		user_id: user._id
	};

	const sort = {
		_id: -1
	};

	if (since !== null) {
		sort._id = 1;
		query._id = {
			$gt: new mongo.ObjectID(since)
		};
	} else if (max !== null) {
		query._id = {
			$lt: new mongo.ObjectID(max)
		};
	}

	// Issue query
	const history = await Signin
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(history.map(async record =>
		await serialize(record))));
});
