import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFolder from '../../../../../models/drive-folder';
import DriveFile, { validateFileName, pack } from '../../../../../models/drive-file';
import { publishDriveStream } from '../../../../../stream';
import define from '../../../define';
import Note from '../../../../../models/note';
import { ObjectID } from 'mongodb';
import { error } from '../../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': '指定したドライブのファイルの情報を更新します。',
		'en-US': 'Update specified file of drive.'
	},

	requireCredential: true,

	kind: 'drive-write',

	params: {
		fileId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のファイルID'
			}
		},

		folderId: {
			validator: $.type(ID).optional.nullable,
			transform: transform,
			default: undefined as any,
			desc: {
				'ja-JP': 'フォルダID'
			}
		},

		name: {
			validator: $.str.optional.pipe(validateFileName),
			default: undefined as any,
			desc: {
				'ja-JP': 'ファイル名',
				'en-US': 'Name of the file'
			}
		},

		isSensitive: {
			validator: $.bool.optional,
			default: undefined as any,
			desc: {
				'ja-JP': 'このメディアが「閲覧注意」(NSFW)かどうか',
				'en-US': 'Whether this media is NSFW'
			}
		}
	}
};

const fetchFolder = (_id: ObjectID, userId: ObjectID) => DriveFolder.findOne({ _id, userId })
	.then(x =>
		x === null ? error('folder-not-found') :
		x._id);

export default define(meta, (ps, user) => DriveFile.findOne({ _id: ps.fileId })
	.then(async x => {
		if (x === null) throw 'file-not-found';
		if (!user.isAdmin && !user.isModerator && !x.metadata.userId.equals(user._id)) throw 'access denied';
		if (ps.name) x.filename = ps.name;
		if (ps.isSensitive !== undefined) x.metadata.isSensitive = ps.isSensitive;
		if (ps.folderId !== undefined) x.metadata.folderId = ps.folderId ? await fetchFolder(ps.folderId, user._id) : null;
		await DriveFile.update(x._id, {
			$set: {
				filename: x.filename,
				'metadata.folderId': x.metadata.folderId,
				'metadata.isSensitive': x.metadata.isSensitive
			}
		});
		Note.find({ '_files._id': x._id })
			.then(notes => {
				for (const note of notes) {
					note._files[note._files.findIndex(f => f._id.equals(x._id))] = x;
					Note.update({ _id: note._id }, {
						$set: { _files: note._files }
					});
				}
			});
		return pack(x, { self: true })
			.then(x => (publishDriveStream(user._id, 'fileUpdated', x), x));
	}));
