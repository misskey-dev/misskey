import * as websocket from 'websocket';
import * as redis from 'redis';
import Game, { pack } from '../models/othello-game';
import { publishOthelloGameStream } from '../event';
import Othello from '../../common/othello/core';

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
			case 'accept':
				accept(true);
				break;

			case 'cancel-accept':
				accept(false);
				break;

			case 'update-settings':
				if (msg.settings == null) return;
				updateSettings(msg.settings);
				break;

			case 'set':
				if (msg.pos == null) return;
				set(msg.pos);
				break;
		}
	});

	async function updateSettings(settings) {
		const game = await Game.findOne({ _id: gameId });

		if (game.is_started) return;
		if (!game.user1_id.equals(user._id) && !game.user2_id.equals(user._id)) return;
		if (game.user1_id.equals(user._id) && game.user1_accepted) return;
		if (game.user2_id.equals(user._id) && game.user2_accepted) return;

		await Game.update({ _id: gameId }, {
			$set: {
				settings
			}
		});

		publishOthelloGameStream(gameId, 'update-settings', settings);
	}

	async function accept(accept: boolean) {
		const game = await Game.findOne({ _id: gameId });

		if (game.is_started) return;

		let bothAccepted = false;

		if (game.user1_id.equals(user._id)) {
			await Game.update({ _id: gameId }, {
				$set: {
					user1_accepted: accept
				}
			});

			publishOthelloGameStream(gameId, 'change-accepts', {
				user1: accept,
				user2: game.user2_accepted
			});

			if (accept && game.user2_accepted) bothAccepted = true;
		} else if (game.user2_id.equals(user._id)) {
			await Game.update({ _id: gameId }, {
				$set: {
					user2_accepted: accept
				}
			});

			publishOthelloGameStream(gameId, 'change-accepts', {
				user1: game.user1_accepted,
				user2: accept
			});

			if (accept && game.user1_accepted) bothAccepted = true;
		} else {
			return;
		}

		if (bothAccepted) {
			// 3秒後、まだacceptされていたらゲーム開始
			setTimeout(async () => {
				const freshGame = await Game.findOne({ _id: gameId });
				if (freshGame == null || freshGame.is_started || freshGame.is_ended) return;

				let bw: number;
				if (freshGame.settings.bw == 'random') {
					bw = Math.random() > 0.5 ? 1 : 2;
				} else {
					bw = freshGame.settings.bw as number;
				}

				await Game.update({ _id: gameId }, {
					$set: {
						started_at: new Date(),
						is_started: true,
						black: bw
					}
				});

				publishOthelloGameStream(gameId, 'started', await pack(gameId));
			}, 3000);
		}
	}

	async function set(pos) {
		const game = await Game.findOne({ _id: gameId });

		if (!game.is_started) return;
		if (game.is_ended) return;
		if (!game.user1_id.equals(user._id) && !game.user2_id.equals(user._id)) return;

		const o = new Othello(game.settings.map, {
			isLlotheo: game.settings.is_llotheo
		});

		game.logs.forEach(log => {
			o.put(log.color, log.pos);
		});

		const myColor =
			(game.user1_id.equals(user._id) && game.black == 1) || (game.user2_id.equals(user._id) && game.black == 2)
				? 'black'
				: 'white';

		if (!o.canPut(myColor, pos)) return;
		o.put(myColor, pos);

		let winner;
		if (o.isEnded) {
			if (o.winner == 'black') {
				winner = game.black == 1 ? game.user1_id : game.user2_id;
			} else if (o.winner == 'white') {
				winner = game.black == 1 ? game.user2_id : game.user1_id;
			} else {
				winner = null;
			}
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
				is_ended: o.isEnded,
				winner_id: winner
			},
			$push: {
				logs: log
			}
		});

		publishOthelloGameStream(gameId, 'set', log);
	}
}
