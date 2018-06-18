import $ from 'cafy'; import ID from '../../../../../cafy-id';
import DriveFile from '../../../../../models/drive-file';
import del from '../../../../../services/drive/delete-file';
import { publishDriveStream } from '../../../../../publishers/stream';
import { ILocalUser } from '../../../../../models/user';

/**
 * Delete a file
 */
module.exports = async (params: any, user: ILocalUser) => {
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

	// Delete
	await del(file);

	// Publish file_deleted event
	publishDriveStream(user._id, 'file_deleted', file._id);

	return;
};
