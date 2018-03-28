import $ from 'cafy';
import OthelloGame, { pack } from '../../models/othello-game';

module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'my' parameter
	const [my = false, myErr] = $(params.my).optional.boolean().$;
	if (myErr) return rej('invalid my param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $(params.limit).optional.number().range(1, 100).$;
	if (limitErr) return rej('invalid limit param');

	// Get 'since_id' parameter
	const [sinceId, sinceIdErr] = $(params.since_id).optional.id().$;
	if (sinceIdErr) return rej('invalid since_id param');

	// Get 'until_id' parameter
	const [untilId, untilIdErr] = $(params.until_id).optional.id().$;
	if (untilIdErr) return rej('invalid until_id param');

	// Check if both of since_id and until_id is specified
	if (sinceId && untilId) {
		return rej('cannot set since_id and until_id');
	}

	const q: any = my ? {
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

	if (sinceId) {
		sort._id = 1;
		q._id = {
			$gt: sinceId
		};
	} else if (untilId) {
		q._id = {
			$lt: untilId
		};
	}

	// Fetch games
	const games = await OthelloGame.find(q, {
		sort,
		limit
	});

	// Reponse
	res(Promise.all(games.map(async (g) => await pack(g, user, {
		detail: false
	}))));
});
