const ReconnectingWebSocket = require('reconnecting-websocket');
const riot = require('riot');
const CONFIG = require('./config');

module.exports = me => {
	let state = 'initializing';
	const stateEv = riot.observable();
	const event = riot.observable();
	const host = CONFIG.apiUrl.replace('http', 'ws');
	const socket = new ReconnectingWebSocket(`${host}?i=${me.token}`);

	socket.onopen = () => {
		state = 'connected';
		stateEv.trigger('connected');
	};

	socket.onclose = () => {
		state = 'reconnecting';
		stateEv.trigger('closed');
	};

	socket.onmessage = message => {
		try {
			const msg = JSON.parse(message.data);
			if (msg.type) {
				event.trigger(msg.type, msg.body);
			}
		} catch (e) {
			// noop
		}
	};

	event.on('i_updated', me.update);

	return {
		stateEv: stateEv,
		getState: () => state,
		event: event
	};
};
