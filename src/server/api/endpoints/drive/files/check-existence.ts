import $ from 'cafy';
import define from '../../../define';
import { DriveFiles } from '../../../../../models';
import { types, bool } from '../../../../../misc/schema';

export const meta = {
	desc: {
		'ja-JP': '与えられたMD5ハッシュ値を持つファイルがドライブに存在するかどうかを返します。',
		'en-US': 'Returns whether the file with the given MD5 hash exists in the user\'s drive.'
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
	const file = await DriveFiles.findOne({
		md5: ps.md5,
		userId: user.id,
	});

	return {
		file: file ? await DriveFiles.pack(file, { self: true }) : null
	};
});
