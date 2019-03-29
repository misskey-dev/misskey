import $ from 'cafy';
import { ID } from '../../../../../../misc/cafy-id';
import Reversi from '../../../../../../games/reversi/core';
import define from '../../../../define';
import { ApiError } from '../../../../error';
import { ReversiGames } from '../../../../../../models';

export const meta = {
	tags: ['games'],

	params: {
		gameId: {
			validator: $.type(ID),
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
	const game = await ReversiGames.findOne(ps.gameId);

	if (game == null) {
		throw new ApiError(meta.errors.noSuchGame);
	}

	const o = new Reversi(game.map, {
		isLlotheo: game.isLlotheo,
		canPutEverywhere: game.canPutEverywhere,
		loopedBoard: game.loopedBoard
	});

	for (const log of game.logs) {
		o.put(log.color, log.pos);
	}

	const packed = await ReversiGames.pack(game, user);

	return Object.assign({
		board: o.board,
		turn: o.turn
	}, packed);
});
