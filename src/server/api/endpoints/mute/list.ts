import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Mute, { packMany } from '../../../../models/mute';
import define from '../../define';
import { errorWhen } from '../../../../prelude/promise';

export const meta = {
	desc: {
		'ja-JP': 'ミュートしているユーザー一覧を取得します。',
		'en-US': 'Get muted users.'
	},

	requireCredential: true,

	kind: 'account/read',

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

export default define(meta, (ps, me) => errorWhen(
	ps.sinceId && !!ps.untilId,
	'cannot set sinceId and untilId')
	.then(() => Mute.find({
			_id:
				ps.sinceId ? { $gt: ps.sinceId } :
				ps.untilId ? { $lt: ps.untilId } : undefined,
			muterId: me._id
		}, {
			limit: ps.limit,
			sort: { _id: ps.sinceId ? -1 : 1 }
		}))
	.then(x => packMany(x, me)));
