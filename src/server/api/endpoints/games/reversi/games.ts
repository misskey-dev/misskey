import $ from 'cafy';
import ID, { transform } from '../../../../../misc/cafy-id';
import ReversiGame, { pack } from '../../../../../models/games/reversi/game';
import define from '../../../define';

export const meta = {
	tags: ['games'],

	params: {
		limit: {
			validator: $.optional.num.range(1, 100),
			default: 10
		},

		sinceId: {
			validator: $.optional.type(ID),
			transform: transform,
		},

		untilId: {
			validator: $.optional.type(ID),
			transform: transform,
		},

		my: {
			validator: $.optional.bool,
			default: false
		}
	}
};

export default define(meta, async (ps, user) => {
	const q: any = ps.my ? {
		isStarted: true,
		$or: [{
			user1Id: user._id
		}, {
			user2Id: user._id
		}]
	} : {
		isStarted: true
	};

	const sort = {
		_id: -1
	};

	if (ps.sinceId) {
		sort._id = 1;
		q._id = {
			$gt: ps.sinceId
		};
	} else if (ps.untilId) {
		q._id = {
			$lt: ps.untilId
		};
	}

	// Fetch games
	const games = await ReversiGame.find(q, {
		sort: sort,
		limit: ps.limit
	});

	return await Promise.all(games.map((g) => pack(g, user, {
		detail: false
	})));
});
