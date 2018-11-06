import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
const ms = require('ms');
import { pack } from '../../../../../models/drive-file';
import uploadFromUrl from '../../../../../services/drive/upload-from-url';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': 'ドライブに指定されたURLに存在するファイルをアップロードします。'
	},

	limit: {
		duration: ms('1hour'),
		max: 10
	},

	requireCredential: true,

	kind: 'drive-write',

	params: {
		url: {
			// TODO: Validate this url
			validator: $.str,
		},

		folderId: {
			validator: $.type(ID).optional.nullable,
			default: null as any as any,
			transform: transform
		},
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	res(pack(await uploadFromUrl(ps.url, user, ps.folderId)));
}));
