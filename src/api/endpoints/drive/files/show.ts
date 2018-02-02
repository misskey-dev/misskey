/**
 * Module dependencies
 */
import $ from 'cafy';
import DriveFile, { pack } from '../../../models/drive-file';

/**
 * Show a file
 *
 * @param {any} params
 * @param {any} user
 * @return {Promise<any>}
 */
module.exports = async (params, user) => {
	// Get 'file_id' parameter
	const [fileId, fileIdErr] = $(params.file_id).id().$;
	if (fileIdErr) throw 'invalid file_id param';

	// Fetch file
	const file = await DriveFile
		.findOne({
			_id: fileId,
			'metadata.user_id': user._id
		});

	if (file === null) {
		throw 'file-not-found';
	}

	// Serialize
	const _file = await pack(file, {
		detail: true
	});

	return _file;
};
