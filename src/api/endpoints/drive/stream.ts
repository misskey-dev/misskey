/**
 * Module dependencies
 */
import $ from 'cafy';
import DriveFile, { pack } from '../../models/drive-file';

/**
 * Get drive stream
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'since_id' parameter
	const [sinceId, sinceIdErr] = $(params.since_id).optional.id().$;
	if (sinceIdErr) return rej('invalid since_id param');

	// Get 'until_id' parameter
	const [untilId, untilIdErr] = $(params.until_id).optional.id().$;
	if (untilIdErr) return rej('invalid until_id param');

	// Check if both of since_id and until_id is specified
	if (sinceId && untilId) {
		return rej('cannot set since_id and until_id');
	}

	// Get 'type' parameter
	const [type, typeErr] = $(params.type).optional.string().match(/^[a-zA-Z\/\-\*]+$/).$;
	if (typeErr) return rej('invalid type param');

	// Construct query
	const sort = {
		_id: -1
	};
	const query = {
		'metadata.user_id': user._id
	} as any;
	if (sinceId) {
		sort._id = 1;
		query._id = {
			$gt: sinceId
		};
	} else if (untilId) {
		query._id = {
			$lt: untilId
		};
	}
	if (type) {
		query.contentType = new RegExp(`^${type.replace(/\*/g, '.+?')}$`);
	}

	// Issue query
	const files = await DriveFile
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(files.map(async file =>
		await pack(file))));
});
