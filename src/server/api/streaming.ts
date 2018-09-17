import * as http from 'http';
import * as websocket from 'websocket';
import Xev from 'xev';

import homeStream from './stream/home';
import localTimelineStream from './stream/local-timeline';
import hybridTimelineStream from './stream/hybrid-timeline';
import globalTimelineStream from './stream/global-timeline';
import userListStream from './stream/user-list';
import driveStream from './stream/drive';
import messagingStream from './stream/messaging';
import messagingIndexStream from './stream/messaging-index';
import reversiGameStream from './stream/games/reversi-game';
import reversiStream from './stream/games/reversi';
import serverStatsStream from './stream/server-stats';
import notesStatsStream from './stream/notes-stats';
import hashtagStream from './stream/hashtag';
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

		const ev = new Xev();

		connection.once('close', () => {
			ev.removeAllListeners();
		});

		const q = request.resourceURL.query as ParsedUrlQuery;
		const [user, app] = await authenticate(q.i as string);

		if (request.resourceURL.pathname === '/games/reversi-game') {
			reversiGameStream(request, connection, ev, user);
			return;
		}

		if (request.resourceURL.pathname === '/local-timeline') {
			localTimelineStream(request, connection, ev, user);
			return;
		}

		if (request.resourceURL.pathname === '/hashtag') {
			hashtagStream(request, connection, ev, user);
			return;
		}

		if (user == null) {
			connection.send('authentication-failed');
			connection.close();
			return;
		}

		const channel: any =
			request.resourceURL.pathname === '/' ? homeStream :
			request.resourceURL.pathname === '/hybrid-timeline' ? hybridTimelineStream :
			request.resourceURL.pathname === '/global-timeline' ? globalTimelineStream :
			request.resourceURL.pathname === '/user-list' ? userListStream :
			request.resourceURL.pathname === '/drive' ? driveStream :
			request.resourceURL.pathname === '/messaging' ? messagingStream :
			request.resourceURL.pathname === '/messaging-index' ? messagingIndexStream :
			request.resourceURL.pathname === '/games/reversi' ? reversiStream :
			null;

		if (channel !== null) {
			channel(request, connection, ev, user, app);
		} else {
			connection.close();
		}
	});
};
