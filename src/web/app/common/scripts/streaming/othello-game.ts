import Stream from './stream';

export class OthelloGameStream extends Stream {
	constructor(me, game) {
		super('othello-game', {
			i: me ? me.token : null,
			game: game.id
		});
	}
}
