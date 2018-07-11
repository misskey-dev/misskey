import Stream from './stream';
import StreamManager from './stream-manager';
import MiOS from '../../../mios';

/**
 * Hybrid timeline stream connection
 */
export class HybridTimelineStream extends Stream {
	constructor(os: MiOS, me) {
		super(os, 'hybrid-timeline', {
			i: me.token
		});
	}
}

export class HybridTimelineStreamManager extends StreamManager<HybridTimelineStream> {
	private me;
	private os: MiOS;

	constructor(os: MiOS, me) {
		super();

		this.me = me;
		this.os = os;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new HybridTimelineStream(this.os, this.me);
		}

		return this.connection;
	}
}
