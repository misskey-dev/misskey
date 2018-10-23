import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import DriveFile, { pack } from '../../../../../models/drive-file';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したドライブのファイルの情報を取得します。',
		'en-US': 'Get specified file of drive.'
	},

	requireCredential: true,

	kind: 'drive-read',

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
			'metadata.userId': user._id,
			'metadata.deletedAt': { $exists: false }
		});

	if (file === null) {
		return rej('file-not-found');
	}

	// Serialize
	const _file = await pack(file, {
		detail: true
	});

	res(_file);
});
