import $ from 'cafy';
import OthelloGame, { pack } from '../../../models/othello-game';
import Othello from '../../../../common/othello/core';

module.exports = (params, user) => new Promise(async (res, rej) => {
	// Get 'game_id' parameter
	const [gameId, gameIdErr] = $(params.game_id).id().$;
	if (gameIdErr) return rej('invalid game_id param');

	const game = await OthelloGame.findOne({ _id: gameId });

	if (game == null) {
		return rej('game not found');
	}

	const o = new Othello(game.settings.map, {
		isLlotheo: game.settings.isLlotheo,
		canPutEverywhere: game.settings.canPutEverywhere,
		loopedBoard: game.settings.loopedBoard
	});

	game.logs.forEach(log => {
		o.put(log.color, log.pos);
	});

	const packed = await pack(game, user);

	res(Object.assign({
		board: o.board,
		turn: o.turn
	}, packed));
});
