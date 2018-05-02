import $ from 'cafy'; import ID from '../../../../cafy-id';
import OthelloGame, { pack } from '../../../../models/othello-game';

module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'my' parameter
	const [my = false, myErr] = $.bool.optional().get(params.my);
	if (myErr) return rej('invalid my param');

	// Get 'limit' parameter
	const [limit = 10, limitErr] = $.num.optional().range(1, 100).get(params.limit);
	if (limitErr) return rej('invalid limit param');

	// Get 'sinceId' parameter
	const [sinceId, sinceIdErr] = $.type(ID).optional().get(params.sinceId);
	if (sinceIdErr) return rej('invalid sinceId param');

	// Get 'untilId' parameter
	const [untilId, untilIdErr] = $.type(ID).optional().get(params.untilId);
	if (untilIdErr) return rej('invalid untilId param');

	// Check if both of sinceId and untilId is specified
	if (sinceId && untilId) {
		return rej('cannot set sinceId and untilId');
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
