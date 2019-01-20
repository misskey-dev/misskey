import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import DriveFile, { packMany } from '../../../../models/drive-file';
import define from '../../define';
import { errorWhen } from '../../../../prelude/promise';
import { query } from '../../../../prelude/query';

export const meta = {
	desc: {
		'ja-JP': 'ドライブのファイル一覧を取得します。',
		'en-US': 'Get files of drive.'
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
		},

		type: {
			validator: $.str.optional.match(/^[a-zA-Z\/\-\*]+$/)
		}
	}
};

export default define(meta, (ps, user) => errorWhen(
	ps.sinceId && !!ps.untilId,
	'cannot set sinceId and untilId')
	.then(() => DriveFile.find(query({
			_id:
				ps.sinceId ? { $gt: ps.sinceId } :
				ps.untilId ? { $lt: ps.untilId } : undefined,
			contentType: new RegExp(`^${ps.type.replace(/\*/g, '.+?')}$`),
			'metadata.userId': user._id,
			'metadata.folderId': ps.folderId,
			'metadata.deletedAt': { $exists: false }
		}), {
			limit: ps.limit,
			sort: { _id: ps.sinceId ? 1 : -1 }
		}))
	.then(x => packMany(x, {
		detail: false,
		self: true
	})));
