import StreamManager from './stream-manager';
import Stream from './stream';
import MiOS from '../../../mios';

export class OthelloStream extends Stream {
	constructor(os: MiOS, me) {
		super(os, 'othello', {
			i: me.token
		});
	}
}

export class OthelloStreamManager extends StreamManager<OthelloStream> {
	private me;
	private os: MiOS;

	constructor(os: MiOS, me) {
		super();

		this.me = me;
		this.os = os;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new OthelloStream(this.os, this.me);
		}

		return this.connection;
	}
}
