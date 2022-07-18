import * as http from 'node:http';
import * as websocket from 'websocket';

import MainStreamConnection from './stream/index.js';
import { ParsedUrlQuery } from 'querystring';
import authenticate from './authenticate.js';
import { EventEmitter } from 'events';
import { subsdcriber as redisClient } from '../../db/redis.js';
import { Users } from '@/models/index.js';

export const initializeStreamingServer = (server: http.Server) => {
	// Init websocket server
	const ws = new websocket.server({
		httpServer: server,
	});

	ws.on('request', async (request) => {
		const q = request.resourceURL.query as ParsedUrlQuery;

		const [user, app] = await authenticate(request.httpRequest.headers.authorization, q.i)
			.catch(err => {
				request.reject(403, err.message);
				return [];
			});
		if (typeof user === 'undefined') {
			return;
		}

		if (user?.isSuspended) {
			request.reject(400);
			return;
		}

		const connection = request.accept();

		const ev = new EventEmitter();

		async function onRedisMessage(_: string, data: string) {
			const parsed = JSON.parse(data);
			ev.emit(parsed.channel, parsed.message);
		}

		redisClient.on('message', onRedisMessage);

		const main = new MainStreamConnection(connection, ev, user, app);

		const intervalId = user ? setInterval(() => {
			Users.update(user.id, {
				lastActiveDate: new Date(),
			});
		}, 1000 * 60 * 5) : null;
		if (user) {
			Users.update(user.id, {
				lastActiveDate: new Date(),
			});
		}

		connection.once('close', () => {
			ev.removeAllListeners();
			main.dispose();
			redisClient.off('message', onRedisMessage);
			if (intervalId) clearInterval(intervalId);
		});

		connection.on('message', async (data) => {
			if (data.type === 'utf8' && data.utf8Data === 'ping') {
				connection.send('pong');
			}
		});
	});
};
