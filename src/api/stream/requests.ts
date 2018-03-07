import * as websocket from 'websocket';
import Xev from 'xev';

const ev = new Xev();

export default function(request: websocket.request, connection: websocket.connection): void {
	const onRequest = request => {
		connection.send(JSON.stringify({
			type: 'request',
			body: request
		}));
	};

	ev.addListener('request', onRequest);

	connection.on('close', () => {
		ev.removeListener('request', onRequest);
	});
}
