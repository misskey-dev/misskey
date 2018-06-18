import Stream from './stream';
import StreamManager from './stream-manager';
import MiOS from '../../../mios';

/**
 * Server stats stream connection
 */
export class ServerStatsStream extends Stream {
	constructor(os: MiOS) {
		super(os, 'server-stats');
	}
}

export class ServerStatsStreamManager extends StreamManager<ServerStatsStream> {
	private os: MiOS;

	constructor(os: MiOS) {
		super();

		this.os = os;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new ServerStatsStream(this.os);
		}

		return this.connection;
	}
}
