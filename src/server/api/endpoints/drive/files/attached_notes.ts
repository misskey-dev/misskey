import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import DriveFile from '../../../../../models/drive-file';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';
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

	res(await packMany(file.metadata.attachedNoteIds || [], user, {
		detail: true
	}));
});
