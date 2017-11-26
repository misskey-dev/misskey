import StreamManager from './stream-manager';
import Connection from './server-stream';

export default class ServerStreamManager extends StreamManager<Connection> {
	public getConnection() {
		if (this.connection == null) {
			this.connection = new Connection();
		}

		return this.connection;
	}
}
