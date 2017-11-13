'use strict';

import * as ReconnectingWebsocket from 'reconnecting-websocket';
import * as riot from 'riot';
import CONFIG from './config';

/**
 * Misskey stream connection
 */
class Connection {
	private state: string;
	private buffer: any[];
	private socket: ReconnectingWebsocket;

	constructor(endpoint, params?) {
		// BIND -----------------------------------
		this.onOpen =    this.onOpen.bind(this);
		this.onClose =   this.onClose.bind(this);
		this.onMessage = this.onMessage.bind(this);
		this.send =      this.send.bind(this);
		this.close =     this.close.bind(this);
		// ----------------------------------------

		riot.observable(this);

		this.state = 'initializing';
		this.buffer = [];

		const host = CONFIG.apiUrl.replace('http', 'ws');
		const query = params
			? Object.keys(params)
				.map(k => encodeURIComponent(k) + '=' + encodeURIComponent(params[k]))
				.join('&')
			: null;

		this.socket = new ReconnectingWebsocket(`${host}/${endpoint}${query ? '?' + query : ''}`);
		this.socket.addEventListener('open', this.onOpen);
		this.socket.addEventListener('close', this.onClose);
		this.socket.addEventListener('message', this.onMessage);
	}

	/**
	 * Callback of when open connection
	 */
	private onOpen() {
		this.state = 'connected';
		(this as any).trigger('_connected_');

		// バッファーを処理
		const _buffer = [].concat(this.buffer); // Shallow copy
		this.buffer = []; // Clear buffer
		_buffer.forEach(message => {
			this.send(message); // Resend each buffered messages
		});
	}

	/**
	 * Callback of when close connection
	 */
	private onClose() {
		this.state = 'reconnecting';
		(this as any).trigger('_closed_');
	}

	/**
	 * Callback of when received a message from connection
	 */
	private onMessage(message) {
		try {
			const msg = JSON.parse(message.data);
			if (msg.type) (this as any).trigger(msg.type, msg.body);
		} catch (e) {
			// noop
		}
	}

	/**
	 * Send a message to connection
	 */
	public send(message) {
		// まだ接続が確立されていなかったらバッファリングして次に接続した時に送信する
		if (this.state != 'connected') {
			this.buffer.push(message);
			return;
		}

		this.socket.send(JSON.stringify(message));
	}

	/**
	 * Close this connection
	 */
	public close() {
		this.socket.removeEventListener('open', this.onOpen);
		this.socket.removeEventListener('message', this.onMessage);
	}
}

export default Connection;
