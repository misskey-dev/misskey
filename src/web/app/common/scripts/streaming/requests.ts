import Stream from './stream';
import StreamManager from './stream-manager';

/**
 * Requests stream connection
 */
export class RequestsStream extends Stream {
	constructor() {
		super('requests');
	}
}

export class RequestsStreamManager extends StreamManager<RequestsStream> {
	public getConnection() {
		if (this.connection == null) {
			this.connection = new RequestsStream();
		}

		return this.connection;
	}
}
