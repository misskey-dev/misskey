import Stream from './stream';
import MiOS from '../../mios';

export class OthelloGameStream extends Stream {
	constructor(os: MiOS, me, game) {
		super(os, 'othello-game', {
			i: me ? me.token : null,
			game: game.id
		});
	}
}
