import { EventEmitter } from 'eventemitter3';
import * as uuid from 'uuid';
import * as ReconnectingWebsocket from 'reconnecting-websocket';
import { wsUrl } from '../../../config';
import MiOS from '../../../mios';

/**
 * Misskey stream connection
 */
export default class Connection extends EventEmitter {
	public state: string;
	private buffer: any[];
	public socket: ReconnectingWebsocket;
	public name: string;
	public connectedAt: Date;
	public user: string = null;
	public in: number = 0;
	public out: number = 0;
	public inout: Array<{
		type: 'in' | 'out',
		at: Date,
		data: string
	}> = [];
	public id: string;
	public isSuspended = false;
	private os: MiOS;

	constructor(os: MiOS, endpoint, params?) {
		super();

		//#region BIND
		this.onOpen =    this.onOpen.bind(this);
		this.onClose =   this.onClose.bind(this);
		this.onMessage = this.onMessage.bind(this);
		this.send =      this.send.bind(this);
		this.close =     this.close.bind(this);
		//#endregion

		this.id = uuid();
		this.os = os;
		this.name = endpoint;
		this.state = 'initializing';
		this.buffer = [];

		const query = params
			? Object.keys(params)
				.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
				.join('&')
			: null;

		this.socket = new ReconnectingWebsocket(`${wsUrl}/${endpoint}${query ? '?' + query : ''}`);
		this.socket.addEventListener('open', this.onOpen);
		this.socket.addEventListener('close', this.onClose);
		this.socket.addEventListener('message', this.onMessage);

		// Register this connection for debugging
		this.os.registerStreamConnection(this);
	}

	/**
	 * Callback of when open connection
	 */
	private onOpen() {
		this.state = 'connected';
		this.emit('_connected_');

		this.connectedAt = new Date();

		// バッファーを処理
		const _buffer = [].concat(this.buffer); // Shallow copy
		this.buffer = []; // Clear buffer
		_buffer.forEach(data => {
			this.send(data); // Resend each buffered messages

			if (this.os.debug) {
				this.out++;
				this.inout.push({ type: 'out', at: new Date(), data });
			}
		});
	}

	/**
	 * Callback of when close connection
	 */
	private onClose() {
		this.state = 'reconnecting';
		this.emit('_disconnected_');
	}

	/**
	 * Callback of when received a message from connection
	 */
	private onMessage(message) {
		if (this.isSuspended) return;

		if (this.os.debug) {
			this.in++;
			this.inout.push({ type: 'in', at: new Date(), data: message.data });
		}

		try {
			const msg = JSON.parse(message.data);
			if (msg.type) this.emit(msg.type, msg.body);
		} catch (e) {
			// noop
		}
	}

	/**
	 * Send a message to connection
	 */
	public send(data) {
		if (this.isSuspended) return;

		// まだ接続が確立されていなかったらバッファリングして次に接続した時に送信する
		if (this.state != 'connected') {
			this.buffer.push(data);
			return;
		}

		if (this.os.debug) {
			this.out++;
			this.inout.push({ type: 'out', at: new Date(), data });
		}

		this.socket.send(JSON.stringify(data));
	}

	/**
	 * Close this connection
	 */
	public close() {
		this.os.unregisterStreamConnection(this);
		this.socket.removeEventListener('open', this.onOpen);
		this.socket.removeEventListener('message', this.onMessage);
	}
}
