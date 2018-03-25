import Stream from './stream';
import StreamManager from './stream-manager';
import MiOS from '../../mios';

/**
 * Drive stream connection
 */
export class DriveStream extends Stream {
	constructor(os: MiOS, me) {
		super(os, 'drive', {
			i: me.account.token
		});
	}
}

export class DriveStreamManager extends StreamManager<DriveStream> {
	private me;
	private os: MiOS;

	constructor(os: MiOS, me) {
		super();

		this.me = me;
		this.os = os;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new DriveStream(this.os, this.me);
		}

		return this.connection;
	}
}
