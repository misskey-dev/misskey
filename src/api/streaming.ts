import * as http from 'http';
import * as websocket from 'websocket';
import * as redis from 'redis';
import User from './models/user';

import homeStream from './stream/home';
import messagingStream from './stream/messaging';

module.exports = (server: http.Server) => {
	/**
	 * Init websocket server
	 */
	const ws = new websocket.server({
		httpServer: server
	});

	ws.on('request', async (request) => {
		const connection = request.accept();

		const user = await authenticate(connection);

		// Connect to Redis
		const subscriber = redis.createClient(
			config.redis.port, config.redis.host);

		connection.on('close', () => {
			subscriber.unsubscribe();
			subscriber.quit();
		});

		const channel =
			request.resourceURL.pathname === '/' ? homeStream :
			request.resourceURL.pathname === '/messaging' ? messagingStream :
			null;

		if (channel !== null) {
			channel(request, connection, subscriber, user);
		} else {
			connection.close();
		}
	});
};

function authenticate(connection: websocket.connection): Promise<any> {
	return new Promise((resolve, reject) => {
		// Listen first message
		connection.once('message', async (data) => {
			const msg = JSON.parse(data.utf8Data);

			// Fetch user
			// SELECT _id
			const user = await User
				.findOne({
					token: msg.i
				}, {
					_id: true
				});

			if (user === null) {
				connection.close();
				return;
			}

			connection.send('authenticated');

			resolve(user);
		});
	});
}
