import * as http from 'http';
import * as websocket from 'websocket';
import * as redis from 'redis';
import config from '../../conf';
import { default as User, IUser } from './models/user';
import AccessToken from './models/access-token';
import isNativeToken from './common/is-native-token';

import homeStream from './stream/home';
import driveStream from './stream/drive';
import messagingStream from './stream/messaging';
import messagingIndexStream from './stream/messaging-index';
import othelloGameStream from './stream/othello-game';
import othelloStream from './stream/othello';
import serverStream from './stream/server';
import requestsStream from './stream/requests';
import channelStream from './stream/channel';

module.exports = (server: http.Server) => {
	/**
	 * Init websocket server
	 */
	const ws = new websocket.server({
		httpServer: server
	});

	ws.on('request', async (request) => {
		const connection = request.accept();

		if (request.resourceURL.pathname === '/server') {
			serverStream(request, connection);
			return;
		}

		if (request.resourceURL.pathname === '/requests') {
			requestsStream(request, connection);
			return;
		}

		// Connect to Redis
		const subscriber = redis.createClient(
			config.redis.port, config.redis.host);

		connection.on('close', () => {
			subscriber.unsubscribe();
			subscriber.quit();
		});

		if (request.resourceURL.pathname === '/channel') {
			channelStream(request, connection, subscriber);
			return;
		}

		const user = await authenticate(request.resourceURL.query.i);

		if (request.resourceURL.pathname === '/othello-game') {
			othelloGameStream(request, connection, subscriber, user);
			return;
		}

		if (user == null) {
			connection.send('authentication-failed');
			connection.close();
			return;
		}

		const channel =
			request.resourceURL.pathname === '/' ? homeStream :
			request.resourceURL.pathname === '/drive' ? driveStream :
			request.resourceURL.pathname === '/messaging' ? messagingStream :
			request.resourceURL.pathname === '/messaging-index' ? messagingIndexStream :
			request.resourceURL.pathname === '/othello' ? othelloStream :
			null;

		if (channel !== null) {
			channel(request, connection, subscriber, user);
		} else {
			connection.close();
		}
	});
};

/**
 * 接続してきたユーザーを取得します
 * @param token 送信されてきたトークン
 */
function authenticate(token: string): Promise<IUser> {
	if (token == null) {
		return Promise.resolve(null);
	}

	return new Promise(async (resolve, reject) => {
		if (isNativeToken(token)) {
			// Fetch user
			const user: IUser = await User
				.findOne({
					host: null,
					'account.token': token
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
			const user: IUser = await User
				.findOne({ _id: accessToken.user_id });

			resolve(user);
		}
	});
}
