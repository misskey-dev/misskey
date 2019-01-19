import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import DriveFolder, { pack } from '../../../../models/drive-folder';
import define from '../../define';
import { errorWhen } from '../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': 'ドライブのフォルダ一覧を取得します。',
		'en-US': 'Get folders of drive.'
	},

	requireCredential: true,

	kind: 'drive-read',

	params: {
		limit: {
			validator: $.num.optional.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		untilId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		folderId: {
			validator: $.type(ID).optional.nullable,
			default: null as any,
			transform: transform,
		}
	}
};

export default define(meta, (ps, user) => errorWhen(
	ps.sinceId && !!ps.untilId,
	'cannot set sinceId and untilId')
	.then(() => DriveFolder.find({
			_id:
				ps.sinceId ? { $gt: ps.sinceId } :
				ps.untilId ? { $lt: ps.sinceId } : undefined,
			userId: user._id,
			parentId: ps.folderId
		}, {
			limit: ps.limit,
			sort: { _id: ps.sinceId ? 1 : -1 }
		}))
	.then(x => Promise.all(x.map(x => pack(x)))));
