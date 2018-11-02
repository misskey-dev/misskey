import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFile, { pack } from '../../../../../models/drive-file';
import define from '../../../define';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したドライブのファイルの情報を取得します。',
		'en-US': 'Get specified file of drive.'
	},

	requireCredential: true,

	kind: 'drive-read',

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
}));
