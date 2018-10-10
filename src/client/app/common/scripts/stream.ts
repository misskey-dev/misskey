import autobind from 'autobind-decorator';
import { EventEmitter } from 'eventemitter3';
import ReconnectingWebsocket from 'reconnecting-websocket';
import { wsUrl } from '../../config';
import MiOS from '../../mios';

/**
 * Misskey stream connection
 */
export default class Stream extends EventEmitter {
	private stream: ReconnectingWebsocket;
	private state: string;
	private buffer: any[];
	private sharedConnectionPools: Pool[] = [];
	private sharedConnections: SharedConnection[] = [];
	private nonSharedConnections: NonSharedConnection[] = [];

	constructor(os: MiOS) {
		super();

		this.state = 'initializing';
		this.buffer = [];

		const user = os.store.state.i;

		this.stream = new ReconnectingWebsocket(wsUrl + (user ? `?i=${user.token}` : ''));
		this.stream.addEventListener('open', this.onOpen);
		this.stream.addEventListener('close', this.onClose);
		this.stream.addEventListener('message', this.onMessage);
	}

	public useSharedConnection = (channel: string): SharedConnection => {
		let pool = this.sharedConnectionPools.find(p => p.channel === channel);

		if (pool == null) {
			pool = new Pool(this, channel);
			this.sharedConnectionPools.push(pool);
		}

		const connection = new SharedConnection(this, channel, pool);
		this.sharedConnections.push(connection);
		return connection;
	}

	@autobind
	public removeSharedConnection(connection: SharedConnection) {
		this.sharedConnections = this.sharedConnections.filter(c => c !== connection);
	}

	public connectToChannel = (channel: string, params?: any): NonSharedConnection => {
		const connection = new NonSharedConnection(this, channel, params);
		this.nonSharedConnections.push(connection);
		return connection;
	}

	@autobind
	public disconnectToChannel(connection: NonSharedConnection) {
		this.nonSharedConnections = this.nonSharedConnections.filter(c => c !== connection);
	}

	/**
	 * Callback of when open connection
	 */
	@autobind
	private onOpen() {
		const isReconnect = this.state == 'reconnecting';

		this.state = 'connected';
		this.emit('_connected_');

		// バッファーを処理
		const _buffer = [].concat(this.buffer); // Shallow copy
		this.buffer = []; // Clear buffer
		_buffer.forEach(data => {
			this.send(data); // Resend each buffered messages
		});

		// チャンネル再接続
		if (isReconnect) {
			this.sharedConnectionPools.forEach(p => {
				p.connect();
			});
			this.nonSharedConnections.forEach(c => {
				c.connect();
			});
		}
	}

	/**
	 * Callback of when close connection
	 */
	@autobind
	private onClose() {
		this.state = 'reconnecting';
		this.emit('_disconnected_');
	}

	/**
	 * Callback of when received a message from connection
	 */
	@autobind
	private onMessage(message) {
		const { type, body } = JSON.parse(message.data);

		if (type == 'channel') {
			const id = body.id;

			let connections: Connection[];

			connections = this.sharedConnections.filter(c => c.id === id);

			if (connections.length === 0) {
				connections = [this.nonSharedConnections.find(c => c.id === id)];
			}

			connections.filter(c => c != null).forEach(c => {
				c.emit(body.type, body.body);
			});
		} else {
			this.emit(type, body);
		}
	}

	/**
	 * Send a message to connection
	 */
	@autobind
	public send(typeOrPayload, payload?) {
		const data = payload === undefined ? typeOrPayload : {
			type: typeOrPayload,
			body: payload
		};

		// まだ接続が確立されていなかったらバッファリングして次に接続した時に送信する
		if (this.state != 'connected') {
			this.buffer.push(data);
			return;
		}

		this.stream.send(JSON.stringify(data));
	}

	/**
	 * Close this connection
	 */
	@autobind
	public close() {
		this.stream.removeEventListener('open', this.onOpen);
		this.stream.removeEventListener('message', this.onMessage);
	}
}

class Pool {
	public channel: string;
	public id: string;
	protected stream: Stream;
	private users = 0;
	private disposeTimerId: any;
	private isConnected = false;

	constructor(stream: Stream, channel: string) {
		this.channel = channel;
		this.stream = stream;

		this.id = Math.random().toString();
	}

	@autobind
	public inc() {
		if (this.users === 0 && !this.isConnected) {
			this.connect();
		}

		this.users++;

		// タイマー解除
		if (this.disposeTimerId) {
			clearTimeout(this.disposeTimerId);
			this.disposeTimerId = null;
		}
	}

	@autobind
	public dec() {
		this.users--;

		// そのコネクションの利用者が誰もいなくなったら
		if (this.users === 0) {
			// また直ぐに再利用される可能性があるので、一定時間待ち、
			// 新たな利用者が現れなければコネクションを切断する
			this.disposeTimerId = setTimeout(() => {
				this.disconnect();
			}, 3000);
		}
	}

	@autobind
	public connect() {
		this.isConnected = true;
		this.stream.send('connect', {
			channel: this.channel,
			id: this.id
		});
	}

	@autobind
	private disconnect() {
		this.isConnected = false;
		this.disposeTimerId = null;
		this.stream.send('disconnect', { id: this.id });
	}
}

abstract class Connection extends EventEmitter {
	public channel: string;
	protected stream: Stream;
	public abstract id: string;

	constructor(stream: Stream, channel: string) {
		super();

		this.stream = stream;
		this.channel = channel;
	}

	@autobind
	public send(id: string, typeOrPayload, payload?) {
		const type = payload === undefined ? typeOrPayload.type : typeOrPayload;
		const body = payload === undefined ? typeOrPayload.body : payload;

		this.stream.send('ch', {
			id: id,
			type: type,
			body: body
		});
	}

	public abstract dispose(): void;
}

class SharedConnection extends Connection {
	private pool: Pool;

	public get id(): string {
		return this.pool.id;
	}

	constructor(stream: Stream, channel: string, pool: Pool) {
		super(stream, channel);

		this.pool = pool;
		this.pool.inc();
	}

	@autobind
	public send(typeOrPayload, payload?) {
		super.send(this.pool.id, typeOrPayload, payload);
	}

	@autobind
	public dispose() {
		this.pool.dec();
		this.removeAllListeners();
		this.stream.removeSharedConnection(this);
	}
}

class NonSharedConnection extends Connection {
	public id: string;
	protected params: any;

	constructor(stream: Stream, channel: string, params?: any) {
		super(stream, channel);

		this.params = params;
		this.id = Math.random().toString();

		this.connect();
	}

	@autobind
	public connect() {
		this.stream.send('connect', {
			channel: this.channel,
			id: this.id,
			params: this.params
		});
	}

	@autobind
	public send(typeOrPayload, payload?) {
		super.send(this.id, typeOrPayload, payload);
	}

	@autobind
	public dispose() {
		this.removeAllListeners();
		this.stream.send('disconnect', { id: this.id });
		this.stream.disconnectToChannel(this);
	}
}
