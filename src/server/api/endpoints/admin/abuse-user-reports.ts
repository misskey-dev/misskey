import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Report, { packMany } from '../../../../models/abuse-user-report';
import define from '../../define';
import { errorWhen } from '../../../../prelude/promise';
import { query } from '../../../../prelude/query';

export const meta = {
	requireCredential: true,
	requireModerator: true,

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
	}
};

export default define(meta, (ps) => errorWhen(
		ps.sinceId && !!ps.untilId,
		'cannot set sinceId and untilId')
	.then(() => Report.find(query({
			_id:
				ps.sinceId ? { $gt: ps.sinceId } :
				ps.untilId ? { $lt: ps.untilId } : undefined
		}), {
			limit: ps.limit,
			sort: { _id: ps.sinceId ? 1 : -1 }
		})
	.then(packMany)));
