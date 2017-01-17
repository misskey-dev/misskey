import * as http from 'http';
import * as websocket from 'websocket';
import * as redis from 'redis';
import config from '../conf';
import User from './models/user';
import AccessToken from './models/access-token';
import isNativeToken from './common/is-native-token';

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

		const user = await authenticate(connection, request.resourceURL.query.i);

		if (user == null) {
			connection.send('authentication-failed');
			connection.close();
			return;
		}

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

function authenticate(connection: websocket.connection, token: string): Promise<any> {
	return new Promise(async (resolve, reject) => {
		if (isNativeToken(token)) {
			// Fetch user
			// SELECT _id
			const user = await User
				.findOne({
					token: token
				}, {
					_id: true
				});

			resolve(user);
		} else {
			const accessToken = await AccessToken.findOne({
				hash: token
			});

			if (accessToken == null) {
				return reject('invalid signature');
			}

			// Fetch user
			// SELECT _id
			const user = await User
				.findOne({ _id: accessToken.user_id }, {
					_id: true
				});

			resolve(user);
		}
	});
}
