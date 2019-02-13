import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import * as ms from 'ms';
import { pack } from '../../../../../models/drive-file';
import uploadFromUrl from '../../../../../services/drive/upload-from-url';
import define from '../../../define';

export const meta = {
	desc: {
		'ja-JP': 'ドライブに指定されたURLに存在するファイルをアップロードします。'
	},

	limit: {
		duration: ms('1hour'),
		max: 60
	},

	requireCredential: true,

	kind: 'drive-write',

	params: {
		url: {
			// TODO: Validate this url
			validator: $.str,
		},

		folderId: {
			validator: $.optional.nullable.type(ID),
			default: null as any,
			transform: transform
		},

		isSensitive: {
			validator: $.optional.bool,
			default: false,
			desc: {
				'ja-JP': 'このメディアが「閲覧注意」(NSFW)かどうか',
				'en-US': 'Whether this media is NSFW'
			}
		},

		force: {
			validator: $.optional.bool,
			default: false,
			desc: {
				'ja-JP': 'true にすると、同じハッシュを持つファイルが既にアップロードされていても強制的にファイルを作成します。',
			}
		}
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	res(pack(await uploadFromUrl(ps.url, user, ps.folderId, null, ps.isSensitive, ps.force), { self: true }));
}));
