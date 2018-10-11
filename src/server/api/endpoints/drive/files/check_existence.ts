import $ from 'cafy';
import DriveFile, { pack } from '../../../../../models/drive-file';
import { ILocalUser } from '../../../../../models/user';

export const meta = {
	desc: {
		'ja-JP': '与えられたMD5ハッシュ値を持つファイルがドライブに存在するかどうかを返します。',
		'en-US': 'Returns whether the file with the given MD5 hash exists in the user\'s drive.'
	},

	requireCredential: true,

	kind: 'drive-read',

	params: {
		md5: $.str.note({
			desc: {
				'ja-JP': 'ファイルのMD5ハッシュ'
			}
		})
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [md5, md5Err] = $.str.get(params.md5);
	if (md5Err) return rej('invalid md5 param');

	const file = await DriveFile.findOne({
		md5: md5,
		'metadata.userId': user._id,
		'metadata.deletedAt': { $exists: false }
	});

	if (file === null) {
		res({ file: null });
	} else {
		res({ file: await pack(file) });
	}
});
