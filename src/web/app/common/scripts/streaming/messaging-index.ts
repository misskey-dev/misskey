import Stream from './stream';
import StreamManager from './stream-manager';

/**
 * Messaging index stream connection
 */
export class MessagingIndexStream extends Stream {
	constructor(me) {
		super('messaging-index', {
			i: me.token
		});
	}
}

export class MessagingIndexStreamManager extends StreamManager<MessagingIndexStream> {
	private me;

	constructor(me) {
		super();

		this.me = me;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new MessagingIndexStream(this.me);
		}

		return this.connection;
	}
}
