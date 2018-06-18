import Stream from './stream';
import StreamManager from './stream-manager';
import MiOS from '../../../mios';

/**
 * Notes stats stream connection
 */
export class NotesStatsStream extends Stream {
	constructor(os: MiOS) {
		super(os, 'notes-stats');
	}
}

export class NotesStatsStreamManager extends StreamManager<NotesStatsStream> {
	private os: MiOS;

	constructor(os: MiOS) {
		super();

		this.os = os;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new NotesStatsStream(this.os);
		}

		return this.connection;
	}
}
