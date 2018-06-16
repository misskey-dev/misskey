import Stream from './stream';
import MiOS from '../../../mios';

export class ReversiGameStream extends Stream {
	constructor(os: MiOS, me, game) {
		super(os, 'reversi-game', {
			i: me ? me.token : null,
			game: game.id
		});
	}
}
