import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import DriveFile from '../../../../../models/drive-file';
import del from '../../../../../services/drive/delete-file';
import { publishDriveStream } from '../../../../../stream';
import { ILocalUser } from '../../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': 'ドライブのファイルを削除します。',
		'en-US': 'Delete a file of drive.'
	},

	requireCredential: true,

	kind: 'drive-write'
};

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

	// Delete
	await del(file);

	// Publish file_deleted event
	publishDriveStream(user._id, 'file_deleted', file._id);

	return;
};
