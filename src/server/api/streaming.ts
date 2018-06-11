import * as http from 'http';
import * as websocket from 'websocket';
import * as redis from 'redis';
import config from '../../config';

import homeStream from './stream/home';
import localTimelineStream from './stream/local-timeline';
import globalTimelineStream from './stream/global-timeline';
import userListStream from './stream/user-list';
import driveStream from './stream/drive';
import messagingStream from './stream/messaging';
import messagingIndexStream from './stream/messaging-index';
import othelloGameStream from './stream/othello-game';
import othelloStream from './stream/othello';
import serverStatsStream from './stream/server-stats';
import notesStatsStream from './stream/notes-stats';
import requestsStream from './stream/requests';
import { ParsedUrlQuery } from 'querystring';
import authenticate from './authenticate';

module.exports = (server: http.Server) => {
	/**
	 * Init websocket server
	 */
	const ws = new websocket.server({
		httpServer: server
	});

	ws.on('request', async (request) => {
		const connection = request.accept();

		if (request.resourceURL.pathname === '/server-stats') {
			serverStatsStream(request, connection);
			return;
		}

		if (request.resourceURL.pathname === '/notes-stats') {
			notesStatsStream(request, connection);
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

		const q = request.resourceURL.query as ParsedUrlQuery;
		const [user, app] = await authenticate(q.i as string);

		if (request.resourceURL.pathname === '/othello-game') {
			othelloGameStream(request, connection, subscriber, user);
			return;
		}

		if (user == null) {
			connection.send('authentication-failed');
			connection.close();
			return;
		}

		const channel: any =
			request.resourceURL.pathname === '/' ? homeStream :
			request.resourceURL.pathname === '/local-timeline' ? localTimelineStream :
			request.resourceURL.pathname === '/global-timeline' ? globalTimelineStream :
			request.resourceURL.pathname === '/user-list' ? userListStream :
			request.resourceURL.pathname === '/drive' ? driveStream :
			request.resourceURL.pathname === '/messaging' ? messagingStream :
			request.resourceURL.pathname === '/messaging-index' ? messagingIndexStream :
			request.resourceURL.pathname === '/othello' ? othelloStream :
			null;

		if (channel !== null) {
			channel(request, connection, subscriber, user, app);
		} else {
			connection.close();
		}
	});
};
