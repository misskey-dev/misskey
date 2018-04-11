import Stream from './stream';
import StreamManager from './stream-manager';
import MiOS from '../../mios';

/**
 * Requests stream connection
 */
export class RequestsStream extends Stream {
	constructor(os: MiOS) {
		super(os, 'requests');
	}
}

export class RequestsStreamManager extends StreamManager<RequestsStream> {
	private os: MiOS;

	constructor(os: MiOS) {
		super();

		this.os = os;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new RequestsStream(this.os);
		}

		return this.connection;
	}
}
