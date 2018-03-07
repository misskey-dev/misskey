import $ from 'cafy';
import Game, { pack } from '../../models/othello-game';

module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'my' parameter
	const [my = false, myErr] = $(params.my).optional.boolean().$;
	if (myErr) return rej('invalid my param');

	const q = my ? {
		$or: [{
			black_user_id: user._id
		}, {
			white_user_id: user._id
		}]
	} : {};

	// Fetch games
	const games = await Game.find(q);

	// Reponse
	res(Promise.all(games.map(async (g) => await pack(g, user))));
});
