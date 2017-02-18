const ReconnectingWebSocket = require('reconnecting-websocket');
const riot = require('riot');

class Connection {
	constructor(me, otherparty) {
		this.event = riot.observable();
		this.me = me;

		const host = CONFIG.api.url.replace('http', 'ws');
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
			const message = JSON.parse(message.data);
			if (message.type) this.event.trigger(message.type, message.body);
		} catch(e) {
			// noop
		}
	}

	close() {
		this.socket.removeEventListener('open', this.onOpen);
		this.socket.removeEventListener('message', this.onMessage);
	}
}

module.exports = Connection;
