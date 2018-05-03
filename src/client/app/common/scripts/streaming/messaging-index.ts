import Stream from './stream';
import StreamManager from './stream-manager';
import MiOS from '../../../mios';

/**
 * Messaging index stream connection
 */
export class MessagingIndexStream extends Stream {
	constructor(os: MiOS, me) {
		super(os, 'messaging-index', {
			i: me.token
		});
	}
}

export class MessagingIndexStreamManager extends StreamManager<MessagingIndexStream> {
	private me;
	private os: MiOS;

	constructor(os: MiOS, me) {
		super();

		this.me = me;
		this.os = os;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new MessagingIndexStream(this.os, this.me);
		}

		return this.connection;
	}
}
