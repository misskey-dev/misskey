import $ from 'cafy'; import ID, { transform } from '../../../../misc/cafy-id';
import Signin, { pack } from '../../../../models/signin';
import define from '../../define';
import { errorWhen } from '../../../../prelude/promise';
import { query } from '../../../../prelude/query';

export const meta = {
	requireCredential: true,

	secure: true,

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
		}
	}
};

export default define(meta, (ps, user) => errorWhen(
	ps.sinceId && !!ps.untilId,
	'cannot set sinceId and untilId')
	.then(() => Signin.find(query({
			_id:
				ps.sinceId ? { $gt: ps.sinceId } :
				ps.untilId ? { $lt: ps.untilId } : undefined,
			userId: user._id
		}), {
			limit: ps.limit,
			sort: { _id: ps.sinceId ? 1 : -1 }
		}))
	.then(x => Promise.all(x.map(pack))));
