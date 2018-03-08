import $ from 'cafy';
import Game, { pack } from '../../models/othello-game';

module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'my' parameter
	const [my = false, myErr] = $(params.my).optional.boolean().$;
	if (myErr) return rej('invalid my param');

	const q = my ? {
		is_started: true,
		$or: [{
			user1_id: user._id
		}, {
			user2_id: user._id
		}]
	} : {
		is_started: true
	};

	// Fetch games
	const games = await Game.find(q, {
		sort: {
			_id: -1
		}
	});

	// Reponse
	res(Promise.all(games.map(async (g) => await pack(g, user))));
});
