import * as websocket from 'websocket';
import * as redis from 'redis';
import * as CRC32 from 'crc-32';
import Game, { pack } from '../models/othello-game';
import { publishOthelloGameStream } from '../event';
import Othello from '../../common/othello/core';
import * as maps from '../../common/othello/maps';

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

			case 'init-form':
				if (msg.body == null) return;
				initForm(msg.body);
				break;

			case 'update-form':
				if (msg.id == null || msg.value === undefined) return;
				updateForm(msg.id, msg.value);
				break;

			case 'message':
				if (msg.body == null) return;
				message(msg.body);
				break;

			case 'set':
				if (msg.pos == null) return;
				set(msg.pos);
				break;

			case 'check':
				if (msg.crc32 == null) return;
				check(msg.crc32);
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

	async function initForm(form) {
		const game = await Game.findOne({ _id: gameId });

		if (game.is_started) return;
		if (!game.user1_id.equals(user._id) && !game.user2_id.equals(user._id)) return;

		const set = game.user1_id.equals(user._id) ? {
			form1: form
		} : {
			form2: form
		};

		await Game.update({ _id: gameId }, {
			$set: set
		});

		publishOthelloGameStream(gameId, 'init-form', {
			user_id: user._id,
			form
		});
	}

	async function updateForm(id, value) {
		const game = await Game.findOne({ _id: gameId });

		if (game.is_started) return;
		if (!game.user1_id.equals(user._id) && !game.user2_id.equals(user._id)) return;

		const form = game.user1_id.equals(user._id) ? game.form2 : game.form1;

		const item = form.find(i => i.id == id);

		if (item == null) return;

		item.value = value;

		const set = game.user1_id.equals(user._id) ? {
			form2: form
		} : {
			form1: form
		};

		await Game.update({ _id: gameId }, {
			$set: set
		});

		publishOthelloGameStream(gameId, 'update-form', {
			user_id: user._id,
			id,
			value
		});
	}

	async function message(message) {
		message.id = Math.random();
		publishOthelloGameStream(gameId, 'message', {
			user_id: user._id,
			message
		});
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
				if (!freshGame.user1_accepted || !freshGame.user2_accepted) return;

				let bw: number;
				if (freshGame.settings.bw == 'random') {
					bw = Math.random() > 0.5 ? 1 : 2;
				} else {
					bw = freshGame.settings.bw as number;
				}

				function getRandomMap() {
					const mapCount = Object.entries(maps).length;
					const rnd = Math.floor(Math.random() * mapCount);
					return Object.entries(maps).find((x, i) => i == rnd)[1].data;
				}

				const map = freshGame.settings.map != null ? freshGame.settings.map : getRandomMap();

				await Game.update({ _id: gameId }, {
					$set: {
						started_at: new Date(),
						is_started: true,
						black: bw,
						'settings.map': map
					}
				});

				//#region 盤面に最初から石がないなどして始まった瞬間に勝敗が決定する場合があるのでその処理
				const o = new Othello(map, {
					isLlotheo: freshGame.settings.is_llotheo,
					canPutEverywhere: freshGame.settings.can_put_everywhere,
					loopedBoard: freshGame.settings.looped_board
				});

				if (o.isEnded) {
					let winner;
					if (o.winner == 'black') {
						winner = freshGame.black == 1 ? freshGame.user1_id : freshGame.user2_id;
					} else if (o.winner == 'white') {
						winner = freshGame.black == 1 ? freshGame.user2_id : freshGame.user1_id;
					} else {
						winner = null;
					}

					await Game.update({
						_id: gameId
					}, {
						$set: {
							is_ended: true,
							winner_id: winner
						}
					});

					publishOthelloGameStream(gameId, 'ended', {
						winner_id: winner,
						game: await pack(gameId, user)
					});
				}
				//#endregion

				publishOthelloGameStream(gameId, 'started', await pack(gameId, user));
			}, 3000);
		}
	}

	// 石を打つ
	async function set(pos) {
		const game = await Game.findOne({ _id: gameId });

		if (!game.is_started) return;
		if (game.is_ended) return;
		if (!game.user1_id.equals(user._id) && !game.user2_id.equals(user._id)) return;

		const o = new Othello(game.settings.map, {
			isLlotheo: game.settings.is_llotheo,
			canPutEverywhere: game.settings.can_put_everywhere,
			loopedBoard: game.settings.looped_board
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

		const crc32 = CRC32.str(game.logs.map(x => x.pos.toString()).join('') + pos.toString());

		await Game.update({
			_id: gameId
		}, {
			$set: {
				crc32,
				is_ended: o.isEnded,
				winner_id: winner
			},
			$push: {
				logs: log
			}
		});

		publishOthelloGameStream(gameId, 'set', Object.assign(log, {
			next: o.turn
		}));

		if (o.isEnded) {
			publishOthelloGameStream(gameId, 'ended', {
				winner_id: winner
			});
		}
	}

	async function check(crc32) {
		const game = await Game.findOne({ _id: gameId });

		if (!game.is_started) return;

		// 互換性のため
		if (game.crc32 == null) return;

		if (crc32 !== game.crc32) {
			connection.send(JSON.stringify({
				type: 'rescue',
				body: await pack(game, user)
			}));
		}
	}
}
