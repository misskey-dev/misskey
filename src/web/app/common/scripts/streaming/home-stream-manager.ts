import StreamManager from './stream-manager';
import Connection from './home-stream';

export default class HomeStreamManager extends StreamManager<Connection> {
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
