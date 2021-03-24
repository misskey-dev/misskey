import * as http from 'http';
import * as websocket from 'websocket';

import MainStreamConnection from './stream';
import { ParsedUrlQuery } from 'querystring';
import authenticate from './authenticate';
import { EventEmitter } from 'events';
import { subsdcriber as redisClient } from '../../db/redis';

module.exports = (server: http.Server) => {
	// Init websocket server
	const ws = new websocket.server({
		httpServer: server
	});

	ws.on('request', async (request) => {
		const q = request.resourceURL.query as ParsedUrlQuery;

		// TODO: トークンが間違ってるなどしてauthenticateに失敗したら
		// コネクション切断するなりエラーメッセージ返すなりする
		// (現状はエラーがキャッチされておらずサーバーのログに流れて邪魔なので)
		const [user, app] = await authenticate(q.i as string);

		const connection = request.accept();

		const ev = new EventEmitter();

		async function onRedisMessage(_: string, data: string) {
			const parsed = JSON.parse(data);
			ev.emit(parsed.channel, parsed.message);
		}

		redisClient.on('message', onRedisMessage);

		const main = new MainStreamConnection(connection, ev, user, app);

		connection.once('close', () => {
			ev.removeAllListeners();
			main.dispose();
			redisClient.off('message', onRedisMessage);
		});

		connection.on('message', async (data) => {
			if (data.utf8Data === 'ping') {
				connection.send('pong');
			}
		});
	});
};
