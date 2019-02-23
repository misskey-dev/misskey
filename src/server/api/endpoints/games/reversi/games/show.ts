import $ from 'cafy';
import ID, { transform } from '../../../../../../misc/cafy-id';
import ReversiGame, { pack } from '../../../../../../models/games/reversi/game';
import Reversi from '../../../../../../games/reversi/core';
import define from '../../../../define';
import { ApiError } from '../../../../error';

export const meta = {
	tags: ['games'],

	params: {
		gameId: {
			validator: $.type(ID),
			transform: transform,
		},
	},

	errors: {
		noSuchGame: {
			message: 'No such game.',
			code: 'NO_SUCH_GAME',
			id: 'f13a03db-fae1-46c9-87f3-43c8165419e1'
		},
	}
};

export default define(meta, async (ps, user) => {
	const game = await ReversiGame.findOne({ _id: ps.gameId });

	if (game == null) {
		throw new ApiError(meta.errors.noSuchGame);
	}

	const o = new Reversi(game.settings.map, {
		isLlotheo: game.settings.isLlotheo,
		canPutEverywhere: game.settings.canPutEverywhere,
		loopedBoard: game.settings.loopedBoard
	});

	for (const log of game.logs)
		o.put(log.color, log.pos);

	const packed = await pack(game, user);

	return Object.assign({
		board: o.board,
		turn: o.turn
	}, packed);
});
