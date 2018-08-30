import $ from 'cafy'; import ID from '../../../../../misc/cafy-id';
import DriveFolder from '../../../../../models/drive-folder';
import DriveFile, { validateFileName, pack } from '../../../../../models/drive-file';
import { publishDriveStream } from '../../../../../stream';
import { ILocalUser } from '../../../../../models/user';
import getParams from '../../../get-params';

export const meta = {
	desc: {
		'ja-JP': '指定したドライブのファイルの情報を更新します。',
		'en-US': 'Update specified file of drive.'
	},

	requireCredential: true,

	kind: 'drive-write',

	params: {
		fileId: $.type(ID).note({
			desc: {
				'ja-JP': '対象のファイルID'
			}
		}),

		folderId: $.type(ID).optional.nullable.note({
			default: undefined,
			desc: {
				'ja-JP': 'フォルダID'
			}
		}),

		name: $.str.optional.pipe(validateFileName).note({
			default: undefined,
			desc: {
				'ja-JP': 'ファイル名',
				'en-US': 'Name of the file'
			}
		}),

		isSensitive: $.bool.optional.note({
			default: undefined,
			desc: {
				'ja-JP': 'このメディアが「閲覧注意」(NSFW)かどうか',
				'en-US': 'Whether this media is NSFW'
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

	if (ps.name) file.filename = ps.name;

	if (ps.isSensitive !== undefined) file.metadata.isSensitive = ps.isSensitive;

	if (ps.folderId !== undefined) {
		if (ps.folderId === null) {
			file.metadata.folderId = null;
		} else {
			// Fetch folder
			const folder = await DriveFolder
				.findOne({
					_id: ps.folderId,
					userId: user._id
				});

			if (folder === null) {
				return rej('folder-not-found');
			}

			file.metadata.folderId = folder._id;
		}
	}

	await DriveFile.update(file._id, {
		$set: {
			filename: file.filename,
			'metadata.folderId': file.metadata.folderId,
			'metadata.isSensitive': file.metadata.isSensitive
		}
	});

	// Serialize
	const fileObj = await pack(file);

	// Response
	res(fileObj);

	// Publish file_updated event
	publishDriveStream(user._id, 'file_updated', fileObj);
});
