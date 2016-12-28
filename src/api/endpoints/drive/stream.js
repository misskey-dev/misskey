'use strict';

/**
 * Module dependencies
 */
import * as mongo from 'mongodb';
import DriveFile from '../../models/drive-file';
import serialize from '../../serializers/drive-file';

/**
 * Get drive stream
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

	// Get 'type' parameter
	let type = params.type;
	if (type === undefined || type === null) {
		type = null;
	} else if (!/^[a-zA-Z\/\-\*]+$/.test(type)) {
		return rej('invalid type format');
	} else {
		type = new RegExp(`^${type.replace(/\*/g, '.+?')}$`);
	}

	// Construct query
	const sort = {
		created_at: -1
	};
	const query = {
		user_id: user._id
	};
	if (since !== null) {
		sort.created_at = 1;
		query._id = {
			$gt: new mongo.ObjectID(since)
		};
	} else if (max !== null) {
		query._id = {
			$lt: new mongo.ObjectID(max)
		};
	}
	if (type !== null) {
		query.type = type;
	}

	// Issue query
	const files = await DriveFile
		.find(query, {
			data: false
		}, {
			limit: limit,
			sort: sort
		})
		.toArray();

	// Serialize
	res(await Promise.all(files.map(async file =>
		await serialize(file))));
});
