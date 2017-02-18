const ReconnectingWebSocket = require('reconnecting-websocket');
const riot = require('riot');

module.exports = me => {
	let state = 'initializing';
	const stateEv = riot.observable();
	const event = riot.observable();
	const host = CONFIG.api.url.replace('http', 'ws');
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
			const message = JSON.parse(message.data);
			if (message.type) {
				event.trigger(message.type, message.body);
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
