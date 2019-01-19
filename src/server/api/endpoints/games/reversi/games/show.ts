import $ from 'cafy'; import ID, { transform } from '../../../../../../misc/cafy-id';
import ReversiGame, { pack, IReversiGame } from '../../../../../../models/games/reversi/game';
import Reversi from '../../../../../../games/reversi/core';
import define from '../../../../define';
import { error } from '../../../../../../prelude/promise';

export const meta = {
	params: {
		gameId: {
			validator: $.type(ID),
			transform: transform,
		},
	}
};

const replay = (game: IReversiGame) => {
	const o = new Reversi(game.settings.map, {
		isLlotheo: game.settings.isLlotheo,
		canPutEverywhere: game.settings.canPutEverywhere,
		loopedBoard: game.settings.loopedBoard
	});
	for (const log of game.logs)
		o.put(log.color, log.pos);
	const { board, turn } = o;
	return { board, turn };
};

export default define(meta, (ps, user) => ReversiGame.findOne({ _id: ps.gameId })
	.then(game =>
		!game ? error('game not found') :
		pack(game, user)
			.then(x => ({ ...replay(game), x }))));
