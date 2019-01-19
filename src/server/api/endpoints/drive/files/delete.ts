import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFile from '../../../../../models/drive-file';
import del from '../../../../../services/drive/delete-file';
import { publishDriveStream } from '../../../../../stream';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

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

export default define(meta, (ps, user) => DriveFile.findOne({ _id: ps.fileId })
	.then(x =>
		x === null ? error('file-not-found') :
		!user.isAdmin && !user.isModerator && !x.metadata.userId.equals(user._id) ? error('access denied') :
		del(x)
			.then(_ => (
				publishDriveStream(user._id, 'fileDeleted', x._id), _))));
