import StreamManager from './stream-manager';
import Stream from './stream';
import MiOS from '../../../mios';

export class ReversiStream extends Stream {
	constructor(os: MiOS, me) {
		super(os, 'reversi', {
			i: me.token
		});
	}
}

export class ReversiStreamManager extends StreamManager<ReversiStream> {
	private me;
	private os: MiOS;

	constructor(os: MiOS, me) {
		super();

		this.me = me;
		this.os = os;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new ReversiStream(this.os, this.me);
		}

		return this.connection;
	}
}
