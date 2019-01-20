import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import DriveFile, { packMany } from '../../../../models/drive-file';
import define from '../../define';
import { errorWhen } from '../../../../prelude/promise';
import { query } from '../../../../prelude/query';

export const meta = {
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
			'metadata.userId': user._id,
			'metadata.deletedAt': { $exists: false },
			contentType: ps.type ? new RegExp(`^${ps.type.replace(/\*/g, '.+?')}$`) : undefined
		}), {
			limit: ps.limit,
			sort: { _id: ps.sinceId ? 1 : -1 }
		}))
	.then(x => packMany(x, { self: true })));
