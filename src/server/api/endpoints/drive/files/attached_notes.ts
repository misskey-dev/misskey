import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFile from '../../../../../models/drive-file';
import define from '../../../define';
import { packMany } from '../../../../../models/note';
import { ApiError } from '../../../error';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したドライブのファイルが添付されている投稿一覧を取得します。',
		'en-US': 'Get the notes that specified file of drive attached.'
	},

	tags: ['drive', 'notes'],

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
	},

	errors: {
		noSuchFile: {
			message: 'No such file.',
			code: 'NO_SUCH_FILE',
			id: 'c118ece3-2e4b-4296-99d1-51756e32d232',
		}
	}
};

export default define(meta, async (ps, user) => {
	// Fetch file
	const file = await DriveFile
		.findOne({
			_id: ps.fileId,
			'metadata.userId': user._id,
			'metadata.deletedAt': { $exists: false }
		});

	if (file === null) {
		throw new ApiError(meta.errors.noSuchFile);
	}

	return await packMany(file.metadata.attachedNoteIds || [], user, {
		detail: true
	});
});
