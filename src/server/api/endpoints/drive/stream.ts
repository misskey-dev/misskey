/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import DriveFile, { pack } from '../../../../models/drive-file';

/**
 * Get drive stream
 */
module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).get();
	if (limitErr) return rej('invalid limit param');

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $(params.sinceId).optional.type(ID).get();
	if (sinceIdErr) return rej('invalid sinceId param');

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $(params.untilId).optional.type(ID).get();
	if (untilIdErr) return rej('invalid untilId param');

	// Check if both of sinceId and untilId is specified
	if (sinceId && untilId) {
		return rej('cannot set sinceId and untilId');
	}

	// Get 'type' parameter
	const [type, typeErr] = $(params.type).optional.string().match(/^[a-zA-Z\/\-\*]+$/).get();
	if (typeErr) return rej('invalid type param');

	// Construct query
	const sort = {
		_id: -1
	};
	const query = {
		'metadata.userId': user._id
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
