import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFile from '../../../../../models/drive-file';
import define from '../../../define';
import { packMany } from '../../../../../models/note';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したドライブのファイルが添付されている投稿一覧を取得します。',
		'en-US': 'Get the notes that specified file of drive attached.'
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

	res(await packMany(file.metadata.attachedNoteIds || [], user, {
		detail: true
	}));
}));
