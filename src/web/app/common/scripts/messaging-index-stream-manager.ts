import StreamManager from './stream-manager';
import Connection from './messaging-index-stream';

export default class ServerStreamManager extends StreamManager<Connection> {
	private me;

	constructor(me) {
		super();

		this.me = me;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new Connection(this.me);
		}

		return this.connection;
	}
}
