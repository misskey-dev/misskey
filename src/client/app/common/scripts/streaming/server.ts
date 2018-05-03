import Stream from './stream';
import StreamManager from './stream-manager';
import MiOS from '../../../mios';

/**
 * Server stream connection
 */
export class ServerStream extends Stream {
	constructor(os: MiOS) {
		super(os, 'server');
	}
}

export class ServerStreamManager extends StreamManager<ServerStream> {
	private os: MiOS;

	constructor(os: MiOS) {
		super();

		this.os = os;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new ServerStream(this.os);
		}

		return this.connection;
	}
}
