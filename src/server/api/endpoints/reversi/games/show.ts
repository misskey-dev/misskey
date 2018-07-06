import $ from 'cafy'; import ID from '../../../../../cafy-id';
import ReversiGame, { pack } from '../../../../../models/reversi-game';
import Reversi from '../../../../../reversi/core';
import { ILocalUser } from '../../../../../models/user';

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	// Get 'gameId' parameter
	const [gameId, gameIdErr] = $.type(ID).get(params.gameId);
	if (gameIdErr) return rej('invalid gameId param');

	const game = await ReversiGame.findOne({ _id: gameId });

	if (game == null) {
		return rej('game not found');
	}

	const o = new Reversi(game.settings.map, {
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
