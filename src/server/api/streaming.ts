import * as http from 'http';
import * as websocket from 'websocket';
import Xev from 'xev';

import MainStreamConnection from './stream';
import { ParsedUrlQuery } from 'querystring';
import authenticate from './authenticate';

module.exports = (server: http.Server) => {
	// Init websocket server
	const ws = new websocket.server({
		httpServer: server
	});

	ws.on('request', async (request) => {
		const connection = request.accept();

		const ev = new Xev();

		const q = request.resourceURL.query as ParsedUrlQuery;
		const [user, app] = await authenticate(q.i as string);

		const main = new MainStreamConnection(connection, ev, user, app);

		connection.once('close', () => {
			ev.removeAllListeners();
			main.dispose();
		});

		connection.on('message', async (data) => {
			if (data.utf8Data == 'ping') {
				connection.send('pong');
			}
		});
	});
};
