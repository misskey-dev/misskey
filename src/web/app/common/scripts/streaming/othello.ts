import StreamManager from './stream-manager';
import Stream from './stream';

export class OthelloStream extends Stream {
	constructor(me) {
		super('othello', {
			i: me.token
		});
	}
}

export class OthelloStreamManager extends StreamManager<OthelloStream> {
	private me;

	constructor(me) {
		super();

		this.me = me;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new OthelloStream(this.me);
		}

		return this.connection;
	}
}
