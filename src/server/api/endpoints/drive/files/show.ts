/**
 * Module dependencies
 */
import $ from 'cafy'; import ID from '../../../../../cafy-id';
import DriveFile, { pack } from '../../../../../models/drive-file';

/**
 * Show a file
 */
module.exports = async (params, user) => {
	// Get 'fileId' parameter
	const [fileId, fileIdErr] = $.type(ID).get(params.fileId);
	if (fileIdErr) throw 'invalid fileId param';

	// Fetch file
	const file = await DriveFile
		.findOne({
			_id: fileId,
			'metadata.userId': user._id
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
