import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Blocking, { packMany } from '../../../../models/blocking';
import define from '../../define';
import { errorWhen } from '../../../../prelude/promise';
import { query } from '../../../../prelude/query';

export const meta = {
	desc: {
		'ja-JP': 'ブロックしているユーザー一覧を取得します。',
		'en-US': 'Get blocking users.'
	},

	requireCredential: true,

	kind: 'following-read',

	params: {
		limit: {
			validator: $.num.optional.range(1, 100),
			default: 30
		},

		sinceId: {
			validator: $.type(ID).optional,
			transform: transform,
		},

		untilId: {
			validator: $.type(ID).optional,
			transform: transform,
		},
	}
};

export default define(meta, (ps, me) =>	errorWhen(
	ps.sinceId && !!ps.untilId,
	'cannot set sinceId and untilId')
	.then(() => Blocking.find(query({
			_id:
				ps.sinceId ? { $gt: ps.sinceId } :
				ps.untilId ? { $lt: ps.untilId } : undefined,
			blockerId: me._id
		}), {
			limit: ps.limit,
			sort: { _id: ps.sinceId ? 1 : -1 }
		}))
	.then(x => packMany(x, me)));
