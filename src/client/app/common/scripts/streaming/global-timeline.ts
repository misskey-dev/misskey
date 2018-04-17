import Stream from './stream';
import StreamManager from './stream-manager';
import MiOS from '../../mios';

/**
 * Global timeline stream connection
 */
export class GlobalTimelineStream extends Stream {
	constructor(os: MiOS, me) {
		super(os, 'global-timeline', {
			i: me.token
		});
	}
}

export class GlobalTimelineStreamManager extends StreamManager<GlobalTimelineStream> {
	private me;
	private os: MiOS;

	constructor(os: MiOS, me) {
		super();

		this.me = me;
		this.os = os;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new GlobalTimelineStream(this.os, this.me);
		}

		return this.connection;
	}
}
