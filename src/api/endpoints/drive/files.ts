/**
 * Module dependencies
 */
import $ from 'cafy';
import DriveFile from '../../models/drive-file';
import serialize from '../../serializers/drive-file';

/**
 * Get drive files
 *
 * @param {any} params
 * @param {any} user
 * @param {any} app
 * @return {Promise<any>}
 */
module.exports = async (params, user, app) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) throw 'invalid limit param';

	// Get 'since_id' parameter
	const [sinceId, sinceIdErr] = $(params.since_id).optional.id().$;
	if (sinceIdErr) throw 'invalid since_id param';

	// Get 'max_id' parameter
	const [maxId, maxIdErr] = $(params.max_id).optional.id().$;
	if (maxIdErr) throw 'invalid max_id param';

	// Check if both of since_id and max_id is specified
	if (sinceId && maxId) {
		throw 'cannot set since_id and max_id';
	}

	// Get 'folder_id' parameter
	const [folderId = null, folderIdErr] = $(params.folder_id).optional.nullable.id().$;
	if (folderIdErr) throw 'invalid folder_id param';

	// Construct query
	const sort = {
		_id: -1
	};
	const query = {
		metadata: {
			user_id: user._id,
			folder_id: folderId
		}
	} as any;
	if (sinceId) {
		sort._id = 1;
		query._id = {
			$gt: sinceId
		};
	} else if (maxId) {
		query._id = {
			$lt: maxId
		};
	}

	// Issue query
	const files = await DriveFile
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	const _files = await Promise.all(files.map(file => serialize(file)));
	return _files
};
