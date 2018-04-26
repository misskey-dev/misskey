/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import DriveFile, { pack } from '../../../../models/drive-file';

/**
 * Get drive files
 */
module.exports = async (params, user, app) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) throw 'invalid limit param';

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $(params.sinceId).optional.type(ID).$;
	if (sinceIdErr) throw 'invalid sinceId param';

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $(params.untilId).optional.type(ID).$;
	if (untilIdErr) throw 'invalid untilId param';

	// Check if both of sinceId and untilId is specified
	if (sinceId && untilId) {
		throw 'cannot set sinceId and untilId';
	}

	// Get 'folderId' parameter
	const [folderId = null, folderIdErr] = $(params.folderId).optional.nullable.type(ID).$;
	if (folderIdErr) throw 'invalid folderId param';

	// Get 'type' parameter
	const [type, typeErr] = $(params.type).optional.string().match(/^[a-zA-Z\/\-\*]+$/).$;
	if (typeErr) throw 'invalid type param';

	// Construct query
	const sort = {
		_id: -1
	};
	const query = {
		'metadata.userId': user._id,
		'metadata.folderId': folderId
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
	const _files = await Promise.all(files.map(file => pack(file)));
	return _files;
};
