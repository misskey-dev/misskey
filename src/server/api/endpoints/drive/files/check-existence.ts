import $ from 'cafy';
import define from '../../../define';
import { DriveFiles } from '../../../../../models';

export const meta = {
	desc: {
		'ja-JP': '与えられたMD5ハッシュ値を持つファイルがドライブに存在するかどうかを返します。',
		'en-US': 'Returns whether the file with the given MD5 hash exists in the user\'s drive.'
	},

	tags: ['drive'],

	requireCredential: true as const,

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
		type: 'boolean' as const,
		optional: false as const, nullable: false as const,
	},
};

export default define(meta, async (ps, user) => {
	const file = await DriveFiles.findOne({
		md5: ps.md5,
		userId: user.id,
	});

	return file != null;
});
