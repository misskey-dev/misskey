const ReconnectingWebSocket = require('reconnecting-websocket');
import * as riot from 'riot';
import CONFIG from './config';

class Connection {
	constructor(me, otherparty) {
		// BIND -----------------------------------
		this.onOpen =    this.onOpen.bind(this);
		this.onMessage = this.onMessage.bind(this);
		this.close =     this.close.bind(this);
		// ----------------------------------------

		this.event = riot.observable();
		this.me = me;

		const host = CONFIG.apiUrl.replace('http', 'ws');
		this.socket = new ReconnectingWebSocket(`${host}/messaging?i=${me.token}&otherparty=${otherparty}`);
		this.socket.addEventListener('open', this.onOpen);
		this.socket.addEventListener('message', this.onMessage);
	}

	onOpen() {
		this.socket.send(JSON.stringify({
			i: this.me.token
		}));
	}

	onMessage(message) {
		try {
			const msg = JSON.parse(message.data);
			if (msg.type) this.event.trigger(msg.type, msg.body);
		} catch(e) {
			// noop
		}
	}

	close() {
		this.socket.removeEventListener('open', this.onOpen);
		this.socket.removeEventListener('message', this.onMessage);
	}
}

export default Connection;
