import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFile from '../../../../../models/drive-file';
import del from '../../../../../services/drive/delete-file';
import { publishDriveStream } from '../../../../../stream';
import define from '../../../define';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': 'ドライブのファイルを削除します。',
		'en-US': 'Delete a file of drive.'
	},

	requireCredential: true,

	kind: 'drive-write',

	params: {
		fileId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のファイルID',
				'en-US': 'Target file ID'
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	// Fetch file
	const file = await DriveFile
		.findOne({
			_id: ps.fileId,
			'metadata.userId': user._id
		});

	if (file === null) {
		return rej('file-not-found');
	}

	// Delete
	await del(file);

	// Publish fileDeleted event
	publishDriveStream(user._id, 'fileDeleted', file._id);

	res();
}));
