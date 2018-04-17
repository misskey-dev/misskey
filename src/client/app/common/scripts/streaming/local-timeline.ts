import Stream from './stream';
import StreamManager from './stream-manager';
import MiOS from '../../mios';

/**
 * Local timeline stream connection
 */
export class LocalTimelineStream extends Stream {
	constructor(os: MiOS, me) {
		super(os, 'local-timeline', {
			i: me.token
		});
	}
}

export class LocalTimelineStreamManager extends StreamManager<LocalTimelineStream> {
	private me;
	private os: MiOS;

	constructor(os: MiOS, me) {
		super();

		this.me = me;
		this.os = os;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new LocalTimelineStream(this.os, this.me);
		}

		return this.connection;
	}
}
