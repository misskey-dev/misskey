import $ from 'cafy'; import ID from '../../../../../cafy-id';
import DriveFile, { pack } from '../../../../../models/drive-file';
import { ILocalUser } from '../../../../../models/user';

/**
 * Show a file
 */
export default async (params: any, user: ILocalUser) => {
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
