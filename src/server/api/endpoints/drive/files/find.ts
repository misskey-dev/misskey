import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import DriveFile, { pack } from '../../../../../models/drive-file';
import define from '../../../define';

export const meta = {
	requireCredential: true,

	tags: ['drive'],

	kind: 'drive-read',

	params: {
		name: {
			validator: $.str
		},

		folderId: {
			validator: $.optional.nullable.type(ID),
			transform: transform,
			default: null as any,
			desc: {
				'ja-JP': 'フォルダID'
			}
		},
	}
};

export default define(meta, async (ps, user) => {
	const files = await DriveFile
		.find({
			filename: ps.name,
			'metadata.userId': user._id,
			'metadata.folderId': ps.folderId
		});

	return await Promise.all(files.map(file => pack(file, { self: true })));
});
