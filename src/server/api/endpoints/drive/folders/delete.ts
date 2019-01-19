import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFolder from '../../../../../models/drive-folder';
import define from '../../../define';
import { publishDriveStream } from '../../../../../stream';
import DriveFile from '../../../../../models/drive-file';
import { sum } from '../../../../../prelude/array';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したドライブのフォルダを削除します。',
		'en-US': 'Delete specified folder of drive.'
	},

	requireCredential: true,

	kind: 'drive-write',

	params: {
		folderId: {
			validator: $.type(ID),
			transform: transform,
			desc: {
				'ja-JP': '対象のフォルダID',
				'en-US': 'Target folder ID'
			}
		}
	}
};

export default define(meta, (ps, user) => DriveFolder.findOne({
		_id: ps.folderId,
		userId: user._id
	}).then(async x => {
		if (x === null) throw 'folder-not-found';
		if (await Promise.all([
			DriveFolder.count({ parentId: x._id }),
			DriveFile.count({ 'metadata.folderId': x._id })
		]).then(sum)) throw 'has-child-contents';
		await DriveFolder.remove({ _id: x._id });
		publishDriveStream(user._id, 'folderDeleted', x._id);
	}));
