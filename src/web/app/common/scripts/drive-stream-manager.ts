import StreamManager from './stream-manager';
import Connection from './drive-stream';

export default class DriveStreamManager extends StreamManager<Connection> {
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
