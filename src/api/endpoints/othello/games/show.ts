import $ from 'cafy';
import Game, { pack } from '../../../models/othello-game';

module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'game_id' parameter
	const [gameId, gameIdErr] = $(params.game_id).id().$;
	if (gameIdErr) return rej('invalid game_id param');

	const game = await Game.findOne({ _id: gameId });

	if (game == null) {
		return rej('game not found');
	}

	res(await pack(game, user));
});
