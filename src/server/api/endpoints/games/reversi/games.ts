import $ from 'cafy'; import ID, { transform } from '../../../../../misc/cafy-id';
import ReversiGame, { pack } from '../../../../../models/games/reversi/game';
import define from '../../../define';
import { errorWhen } from '../../../../../prelude/promise';
import { query } from '../../../../../prelude/query';

export const meta = {
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

		my: {
			validator: $.bool.optional,
			default: false
		}
	}
};

export default define(meta, (ps, user) => errorWhen(
	ps.sinceId && !!ps.untilId,
	'cannot set sinceId and untilId')
	.then(() => ReversiGame.find(query({
			_id:
				ps.sinceId ? { $gt: ps.sinceId } :
				ps.untilId ? { $lt: ps.untilId } : undefined,
			isStarted: true,
			$or: ps.my ? [
				{ user1Id: user._id },
				{ user2Id: user._id }
			] : undefined
		}), {
			sort: { _id: ps.sinceId ? 1 : -1 },
			limit: ps.limit
		}))
	.then(x => Promise.all(x.map(x => pack(x, user, { detail: false })))));
