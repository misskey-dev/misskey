import $ from 'cafy'; import ID, { transform } from '../../../../../../misc/cafy-id';
import ReversiGame, { pack } from '../../../../../../models/games/reversi/game';
import Reversi from '../../../../../../games/reversi/core';
import { ILocalUser } from '../../../../../../models/user';
import getParams from '../../../../get-params';

export const meta = {
	params: {
		gameId: {
			validator: $.type(ID),
			transform: transform,
		},
	}
};

export default (params: any, user: ILocalUser) => new Promise(async (res, rej) => {
	const [ps, psErr] = getParams(meta, params);
	if (psErr) return rej(psErr);

	const game = await ReversiGame.findOne({ _id: ps.gameId });

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
