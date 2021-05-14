import autobind from 'autobind-decorator';
import { EventEmitter } from 'eventemitter3';
import ReconnectingWebsocket from 'reconnecting-websocket';
import { stringify } from 'querystring';
import { markRaw } from '@vue/reactivity';

function urlQuery(obj: {}): string {
	return stringify(Object.entries(obj)
		.filter(([, v]) => Array.isArray(v) ? v.length : v !== undefined)
		.reduce((a, [k, v]) => (a[k] = v, a), {} as Record<string, any>));
}

/**
 * Misskey stream connection
 */
export default class Stream extends EventEmitter {
	private stream: ReconnectingWebsocket;
	public state: 'initializing' | 'reconnecting' | 'connected' = 'initializing';
	private sharedConnectionPools: Pool[] = [];
	private sharedConnections: SharedConnection[] = [];
	private nonSharedConnections: NonSharedConnection[] = [];

	constructor(origin: string, user: { token: string; } | null, options?: {
	}) {
		super();

		const query = urlQuery({
			i: user?.token,
			_t: Date.now(),
		});

		this.stream = new ReconnectingWebsocket(`${origin.replace('http://', 'ws://').replace('https://', 'wss://')}/streaming?${query}`, '', {
			minReconnectionDelay: 1 // https://github.com/pladaria/reconnecting-websocket/issues/91
		});
		this.stream.addEventListener('open', this.onOpen);
		this.stream.addEventListener('close', this.onClose);
		this.stream.addEventListener('message', this.onMessage);
	}

	@autobind
	public useSharedConnection(channel: string, name?: string): SharedConnection {
		let pool = this.sharedConnectionPools.find(p => p.channel === channel);

		if (pool == null) {
			pool = new Pool(this, channel);
			this.sharedConnectionPools.push(pool);
		}

		const connection = markRaw(new SharedConnection(this, channel, pool, name));
		this.sharedConnections.push(connection);
		return connection;
	}

	@autobind
	public removeSharedConnection(connection: SharedConnection) {
		this.sharedConnections = this.sharedConnections.filter(c => c !== connection);
	}

	@autobind
	public removeSharedConnectionPool(pool: Pool) {
		this.sharedConnectionPools = this.sharedConnectionPools.filter(p => p !== pool);
	}

	@autobind
	public connectToChannel(channel: string, params?: any): NonSharedConnection {
		const connection = markRaw(new NonSharedConnection(this, channel, params));
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
		const isReconnect = this.state === 'reconnecting';

		this.state = 'connected';
		this.emit('_connected_');

		// チャンネル再接続
		if (isReconnect) {
			for (const p of this.sharedConnectionPools)
				p.connect();
			for (const c of this.nonSharedConnections)
				c.connect();
		}
	}

	/**
	 * Callback of when close connection
	 */
	@autobind
	private onClose() {
		if (this.state === 'connected') {
			this.state = 'reconnecting';
			this.emit('_disconnected_');
		}
	}

	/**
	 * Callback of when received a message from connection
	 */
	@autobind
	private onMessage(message: { data: string; }) {
		const { type, body } = JSON.parse(message.data);

		if (type === 'channel') {
			const id = body.id;

			let connections: Connection[];

			connections = this.sharedConnections.filter(c => c.id === id);

			if (connections.length === 0) {
				const found = this.nonSharedConnections.find(c => c.id === id);
				if (found) {
					connections = [found];
				}
			}

			for (const c of connections.filter(c => c != null)) {
				c.emit(body.type, Object.freeze(body.body));
				c.inCount++;
			}
		} else {
			this.emit(type, Object.freeze(body));
		}
	}

	/**
	 * Send a message to connection
	 */
	@autobind
	public send(typeOrPayload: any, payload?: any) {
		const data = payload === undefined ? typeOrPayload : {
			type: typeOrPayload,
			body: payload
		};

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

let idCounter = 0;

class Pool {
	public channel: string;
	public id: string;
	protected stream: Stream;
	public users = 0;
	private disposeTimerId: any;
	private isConnected = false;

	constructor(stream: Stream, channel: string) {
		this.channel = channel;
		this.stream = stream;

		this.id = (++idCounter).toString();

		this.stream.on('_disconnected_', this.onStreamDisconnected);
	}

	@autobind
	private onStreamDisconnected() {
		this.isConnected = false;
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
		if (this.isConnected) return;
		this.isConnected = true;
		this.stream.send('connect', {
			channel: this.channel,
			id: this.id
		});
	}

	@autobind
	private disconnect() {
		this.stream.off('_disconnected_', this.onStreamDisconnected);
		this.stream.send('disconnect', { id: this.id });
		this.stream.removeSharedConnectionPool(this);
	}
}

abstract class Connection extends EventEmitter {
	public channel: string;
	protected stream: Stream;
	public abstract id: string;

	public name?: string; // for debug
	public inCount: number = 0; // for debug
	public outCount: number = 0; // for debug

	constructor(stream: Stream, channel: string, name?: string) {
		super();

		this.stream = stream;
		this.channel = channel;
		this.name = name;
	}

	@autobind
	public send(id: string, typeOrPayload: any, payload?: any) {
		const type = payload === undefined ? typeOrPayload.type : typeOrPayload;
		const body = payload === undefined ? typeOrPayload.body : payload;

		this.stream.send('ch', {
			id: id,
			type: type,
			body: body
		});

		this.outCount++;
	}

	public abstract dispose(): void;
}

class SharedConnection extends Connection {
	private pool: Pool;

	public get id(): string {
		return this.pool.id;
	}

	constructor(stream: Stream, channel: string, pool: Pool, name?: string) {
		super(stream, channel, name);

		this.pool = pool;
		this.pool.inc();
	}

	@autobind
	public send(typeOrPayload: any, payload?: any) {
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
		this.id = (++idCounter).toString();

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
	public send(typeOrPayload: any, payload?: any) {
		super.send(this.id, typeOrPayload, payload);
	}

	@autobind
	public dispose() {
		this.removeAllListeners();
		this.stream.send('disconnect', { id: this.id });
		this.stream.disconnectToChannel(this);
	}
}
