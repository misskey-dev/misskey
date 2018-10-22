import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import DriveFile from '../../../../../models/drive-file';
import del from '../../../../../services/drive/delete-file';
import { publishDriveStream } from '../../../../../stream';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': 'ドライブのファイルを削除します。',
		'en-US': 'Delete a file of drive.'
	},

	requireCredential: true,

	kind: 'drive-write',

	params: {
		fileId: $.type(ID).note({
			desc: {
				'ja-JP': '対象のファイルID',
				'en-US': 'Target file ID'
			}
		})
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

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

	// Publish file_deleted event
	publishDriveStream(user._id, 'file_deleted', file._id);

	res();
});
