import Stream from '../../stream';
import MiOS from '../../../../../mios';

export class ReversiGameStream extends Stream {
	constructor(os: MiOS, me, game) {
		super(os, 'games/reversi-game', me ? {
			i: me.token,
			game: game.id
		} : {
			game: game.id
		});
	}
}
