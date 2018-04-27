/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../cafy-id';
import DriveFolder, { pack } from '../../../../models/drive-folder';

/**
 * Get drive folders
 */
module.exports = (params, user, app) => new Promise(async (res, rej) => {
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

	// Get 'folderId' parameter
	const [folderId = null, folderIdErr] = $(params.folderId).optional.nullable.type(ID).get();
	if (folderIdErr) return rej('invalid folderId param');

	// Construct query
	const sort = {
		_id: -1
	};
	const query = {
		userId: user._id,
		parentId: folderId
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

	// Issue query
	const folders = await DriveFolder
		.find(query, {
			limit: limit,
			sort: sort
		});

	// Serialize
	res(await Promise.all(folders.map(async folder =>
		await pack(folder))));
});
