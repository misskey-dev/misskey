import Stream from './stream';
import StreamManager from './stream-manager';

/**
 * Server stream connection
 */
export class ServerStream extends Stream {
	constructor() {
		super('server');
	}
}

export class ServerStreamManager extends StreamManager<ServerStream> {
	public getConnection() {
		if (this.connection == null) {
			this.connection = new ServerStream();
		}

		return this.connection;
	}
}
