import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFile, { pack } from '../../../../../models/drive-file';
import define from '../../../define';

export const meta = {
	requireCredential: true,

	kind: 'drive-read',

	params: {
		name: {
			validator: $.str
		},

		folderId: {
			validator: $.type(ID).optional.nullable,
			transform: transform,
			default: null as any,
			desc: {
				'ja-JP': 'フォルダID'
			}
		},
	}
};

export default define(meta, (ps, user) => DriveFile.find({
		filename: ps.name,
		'metadata.userId': user._id,
		'metadata.folderId': ps.folderId
	})
	.then(x => Promise.all(x.map(x => pack(x, { self: true })))));
