import * as websocket from 'websocket';
import * as redis from 'redis';
import Game from '../models/othello-game';
import { publishOthelloGameStream } from '../event';
import Othello from '../../common/othello';

export default function(request: websocket.request, connection: websocket.connection, subscriber: redis.RedisClient, user: any): void {
	const gameId = request.resourceURL.query.game;

	// Subscribe game stream
	subscriber.subscribe(`misskey:othello-game-stream:${gameId}`);
	subscriber.on('message', (_, data) => {
		connection.send(data);
	});

	connection.on('message', async (data) => {
		const msg = JSON.parse(data.utf8Data);

		switch (msg.type) {
			case 'set':
				if (msg.pos == null) return;
				set(msg.pos);
				break;
		}
	});

	async function set(pos) {
		const game = await Game.findOne({ _id: gameId });

		if (game.is_ended) return;
		if (!game.black_user_id.equals(user._id) && !game.white_user_id.equals(user._id)) return;

		const o = new Othello();

		game.logs.forEach(log => {
			o.set(log.color, log.pos);
		});

		const myColor = game.black_user_id.equals(user._id) ? 'black' : 'white';
		const opColor = myColor == 'black' ? 'white' : 'black';

		if (!o.canReverse(myColor, pos)) return;
		o.set(myColor, pos);

		let turn;
		if (o.getPattern(opColor).length > 0) {
			turn = myColor == 'black' ? game.white_user_id : game.black_user_id;
		} else if (o.getPattern(myColor).length > 0) {
			turn = myColor == 'black' ? game.black_user_id : game.white_user_id;
		} else {
			turn = null;
		}

		const isEnded = turn === null;

		let winner;
		if (isEnded) {
			winner = o.blackCount == o.whiteCount ? null : o.blackCount > o.whiteCount ? game.black_user_id : game.white_user_id;
		}

		const log = {
			at: new Date(),
			color: myColor,
			pos
		};

		await Game.update({
			_id: gameId
		}, {
			$set: {
				turn_user_id: turn,
				is_ended: isEnded,
				winner_id: winner
			},
			$push: {
				logs: log
			}
		});

		publishOthelloGameStream(gameId, 'set', log);
	}
}
