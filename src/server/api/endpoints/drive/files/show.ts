import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import DriveFile, { pack } from '../../../../../models/drive-file';
import { ILocalUser } from '../../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '指定したドライブのファイルの情報を取得します。',
		'en-US': 'Get specified file of drive.'
	},

	requireCredential: true,

	kind: 'drive-read'
};

export default async (params: any, user: ILocalUser) => {
	// Get 'fileId' parameter
	const [fileId, fileIdErr] = $.type(ID).get(params.fileId);
	if (fileIdErr) throw 'invalid fileId param';

	// Fetch file
	const file = await DriveFile
		.findOne({
			_id: fileId,
			'metadata.userId': user._id,
			'metadata.deletedAt': { $exists: false }
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
