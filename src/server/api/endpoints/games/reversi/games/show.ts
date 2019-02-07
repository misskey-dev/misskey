import $ from 'cafy';
import ID, { transform } from '../../../../../../misc/cafy-id';
import ReversiGame, { pack } from '../../../../../../models/games/reversi/game';
import Reversi from '../../../../../../games/reversi/core';
import define from '../../../../define';

export const meta = {
	params: {
		gameId: {
			validator: $.type(ID),
			transform: transform,
		},
	}
};

export default define(meta, (ps, user) => new Promise(async (res, rej) => {
	const game = await ReversiGame.findOne({ _id: ps.gameId });

	if (game == null) {
		return rej('game not found');
	}

	const o = new Reversi(game.settings.map, {
		isLlotheo: game.settings.isLlotheo,
		canPutEverywhere: game.settings.canPutEverywhere,
		loopedBoard: game.settings.loopedBoard
	});

	for (const log of game.logs)
		o.put(log.color, log.pos);

	const packed = await pack(game, user);

	res(Object.assign({
		board: o.board,
		turn: o.turn
	}, packed));
}));
