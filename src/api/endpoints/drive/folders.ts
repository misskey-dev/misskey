/**
 * Module dependencies
 */
import it from 'cafy';
import DriveFolder from '../../models/drive-folder';
import serialize from '../../serializers/drive-folder';

/**
 * Get drive folders
 *
 * @param {any} params
 * @param {any} user
 * @param {any} app
 * @return {Promise<any>}
 */
module.exports = (params, user, app) => new Promise(async (res, rej) => {
	// Get 'limit' parameter
	const [limit = 10, limitErr] = it(params.limit).expect.number().range(1, 100).get();
	if (limitErr) return rej('invalid limit param');

	// Get 'since_id' parameter
	const [sinceId, sinceIdErr] = it(params.since_id).expect.id().get();
	if (sinceIdErr) return rej('invalid since_id param');

	// Get 'max_id' parameter
	const [maxId, maxIdErr] = it(params.max_id).expect.id().get();
	if (maxIdErr) return rej('invalid max_id param');

	// Check if both of since_id and max_id is specified
	if (sinceId && maxId) {
		return rej('cannot set since_id and max_id');
	}

	// Get 'folder_id' parameter
	const [folderId = null, folderIdErr] = it(params.folder_id).expect.nullable.id().get();
	if (folderIdErr) return rej('invalid folder_id param');

	// Construct query
	const sort = {
		_id: -1
	};
	const query = {
		user_id: user._id,
		parent_id: folderId
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
	const folders = await DriveFolder
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(folders.map(async folder =>
		await serialize(folder))));
});
