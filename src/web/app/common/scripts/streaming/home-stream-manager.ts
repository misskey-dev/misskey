import StreamManager from './stream-manager';
import Connection from './home-stream';
import MiOS from '../../mios';

export default class HomeStreamManager extends StreamManager<Connection> {
	private me;
	private os: MiOS;

	constructor(os: MiOS, me) {
		super();

		this.me = me;
		this.os = os;
	}

	public getConnection() {
		if (this.connection == null) {
			this.connection = new Connection(this.os, this.me);
		}

		return this.connection;
	}
}
