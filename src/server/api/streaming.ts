import * as http from 'http';
import * as websocket from 'websocket';
import Xev from 'xev';

import MainStreamConnection from './stream';
import { ParsedUrlQuery } from 'querystring';
import authenticate from './authenticate';
import channels from './stream/channels';

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

		// 後方互換性のため
		if (request.resourceURL.pathname !== '/streaming') {
			main.sendMessageToWsOverride = (type: string, payload: any) => {
				if (type == 'channel') {
					type = payload.type;
					payload = payload.body;
				}
				if (type.startsWith('api:')) {
					type = payload.type.replace('api:', 'api-res:');
				}
				connection.send(JSON.stringify({
					type: type,
					body: payload
				}));
			};

			main.connectChannel(Math.random().toString(), null,
				request.resourceURL.pathname === '/' ? channels.homeTimeline :
				request.resourceURL.pathname === '/local-timeline' ? channels.localTimeline :
				request.resourceURL.pathname === '/hybrid-timeline' ? channels.hybridTimeline :
				request.resourceURL.pathname === '/global-timeline' ? channels.globalTimeline : null);
		}

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
