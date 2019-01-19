import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFolder, { pack } from '../../../../../models/drive-folder';
import define from '../../../define';
import { error } from '../../../../../prelude/promise';

export const meta = {
	stability: 'stable',

	desc: {
		'ja-JP': '指定したドライブのフォルダの情報を取得します。',
		'en-US': 'Get specified folder of drive.'
	},

	requireCredential: true,

	kind: 'drive-read',

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
	})
	.then(x =>
		x === null ? error('folder-not-found') :
		pack(x, { detail: true })));
