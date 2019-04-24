import $ from 'cafy';
import define from '../../../define';
import { DriveFiles } from '../../../../../models';
import { types, bool } from '../../../../../misc/schema';

export const meta = {
	desc: {
		'ja-JP': '与えられたMD5ハッシュ値を持つファイルを取得します。',
	},

	tags: ['drive'],

	requireCredential: true,

	kind: 'read:drive',

	params: {
		md5: {
			validator: $.str,
			desc: {
				'ja-JP': 'ファイルのMD5ハッシュ'
			}
		}
	},

	res: {
		type: types.array,
		optional: bool.false, nullable: bool.false,
		items: {
			type: types.object,
			optional: bool.false, nullable: bool.false,
			ref: 'DriveFile',
		}
	},
};

export default define(meta, async (ps, user) => {
	const files = await DriveFiles.find({
		md5: ps.md5,
		userId: user.id,
	});

	return await DriveFiles.packMany(files, { self: true });
});
