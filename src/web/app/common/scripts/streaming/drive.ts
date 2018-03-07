import Stream from './stream';
import StreamManager from './stream-manager';

/**
 * Drive stream connection
 */
export class DriveStream extends Stream {
	constructor(me) {
		super('drive', {
			i: me.token
		});
	}
}

export class DriveStreamManager extends StreamManager<DriveStream> {
	private me;

	constructor(me) {
		super();

		this.me = me;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new DriveStream(this.me);
		}

		return this.connection;
	}
}
