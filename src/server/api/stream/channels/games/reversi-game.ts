import autobind from 'autobind-decorator';
import * as CRC32 from 'crc-32';
import * as mongo from 'mongodb';
import ReversiGame, { pack } from '../../../../../models/games/reversi/game';
import { publishReversiGameStream } from '../../../../../stream';
import Reversi from '../../../../../games/reversi/core';
import * as maps from '../../../../../games/reversi/maps';
import Channel from '../../channel';

export default class extends Channel {
	private gameId: mongo.ObjectID;

	@autobind
	public async init(params: any) {
		this.gameId = new mongo.ObjectID(params.gameId as string);

		// Subscribe game stream
		this.subscriber.on(`reversiGameStream:${this.gameId}`, data => {
			this.send(data);
		});
	}

	@autobind
	public onMessage(type: string, body: any) {
		switch (type) {
			case 'accept': this.accept(true); break;
			case 'cancelAccept': this.accept(false); break;
			case 'updateSettings': this.updateSettings(body.settings); break;
			case 'initForm': this.initForm(body); break;
			case 'updateForm': this.updateForm(body.id, body.value); break;
			case 'message': this.message(body); break;
			case 'set': this.set(body.pos); break;
			case 'check': this.check(body.crc32); break;
		}
	}

	@autobind
	private async updateSettings(settings: any) {
		const game = await ReversiGame.findOne({ _id: this.gameId });

		if (game.isStarted) return;
		if (!game.user1Id.equals(this.user._id) && !game.user2Id.equals(this.user._id)) return;
		if (game.user1Id.equals(this.user._id) && game.user1Accepted) return;
		if (game.user2Id.equals(this.user._id) && game.user2Accepted) return;

		await ReversiGame.update({ _id: this.gameId }, {
			$set: {
				settings
			}
		});

		publishReversiGameStream(this.gameId, 'updateSettings', settings);
	}

	@autobind
	private async initForm(form: any) {
		const game = await ReversiGame.findOne({ _id: this.gameId });

		if (game.isStarted) return;
		if (!game.user1Id.equals(this.user._id) && !game.user2Id.equals(this.user._id)) return;

		const set = game.user1Id.equals(this.user._id) ? {
			form1: form
		} : {
				form2: form
			};

		await ReversiGame.update({ _id: this.gameId }, {
			$set: set
		});

		publishReversiGameStream(this.gameId, 'initForm', {
			userId: this.user._id,
			form
		});
	}

	@autobind
	private async updateForm(id: string, value: any) {
		const game = await ReversiGame.findOne({ _id: this.gameId });

		if (game.isStarted) return;
		if (!game.user1Id.equals(this.user._id) && !game.user2Id.equals(this.user._id)) return;

		const form = game.user1Id.equals(this.user._id) ? game.form2 : game.form1;

		const item = form.find((i: any) => i.id == id);

		if (item == null) return;

		item.value = value;

		const set = game.user1Id.equals(this.user._id) ? {
			form2: form
		} : {
				form1: form
			};

		await ReversiGame.update({ _id: this.gameId }, {
			$set: set
		});

		publishReversiGameStream(this.gameId, 'updateForm', {
			userId: this.user._id,
			id,
			value
		});
	}

	@autobind
	private async message(message: any) {
		message.id = Math.random();
		publishReversiGameStream(this.gameId, 'message', {
			userId: this.user._id,
			message
		});
	}

	@autobind
	private async accept(accept: boolean) {
		const game = await ReversiGame.findOne({ _id: this.gameId });

		if (game.isStarted) return;

		let bothAccepted = false;

		if (game.user1Id.equals(this.user._id)) {
			await ReversiGame.update({ _id: this.gameId }, {
				$set: {
					user1Accepted: accept
				}
			});

			publishReversiGameStream(this.gameId, 'changeAccepts', {
				user1: accept,
				user2: game.user2Accepted
			});

			if (accept && game.user2Accepted) bothAccepted = true;
		} else if (game.user2Id.equals(this.user._id)) {
			await ReversiGame.update({ _id: this.gameId }, {
				$set: {
					user2Accepted: accept
				}
			});

			publishReversiGameStream(this.gameId, 'changeAccepts', {
				user1: game.user1Accepted,
				user2: accept
			});

			if (accept && game.user1Accepted) bothAccepted = true;
		} else {
			return;
		}

		if (bothAccepted) {
			// 3秒後、まだacceptされていたらゲーム開始
			setTimeout(async () => {
				const freshGame = await ReversiGame.findOne({ _id: this.gameId });
				if (freshGame == null || freshGame.isStarted || freshGame.isEnded) return;
				if (!freshGame.user1Accepted || !freshGame.user2Accepted) return;

				let bw: number;
				if (freshGame.settings.bw == 'random') {
					bw = Math.random() > 0.5 ? 1 : 2;
				} else {
					bw = freshGame.settings.bw as number;
				}

				function getRandomMap() {
					const mapCount = Object.entries(maps).length;
					const rnd = Math.floor(Math.random() * mapCount);
					return Object.values(maps)[rnd].data;
				}

				const map = freshGame.settings.map != null ? freshGame.settings.map : getRandomMap();

				await ReversiGame.update({ _id: this.gameId }, {
					$set: {
						startedAt: new Date(),
						isStarted: true,
						black: bw,
						'settings.map': map
					}
				});

				//#region 盤面に最初から石がないなどして始まった瞬間に勝敗が決定する場合があるのでその処理
				const o = new Reversi(map, {
					isLlotheo: freshGame.settings.isLlotheo,
					canPutEverywhere: freshGame.settings.canPutEverywhere,
					loopedBoard: freshGame.settings.loopedBoard
				});

				if (o.isEnded) {
					let winner;
					if (o.winner === true) {
						winner = freshGame.black == 1 ? freshGame.user1Id : freshGame.user2Id;
					} else if (o.winner === false) {
						winner = freshGame.black == 1 ? freshGame.user2Id : freshGame.user1Id;
					} else {
						winner = null;
					}

					await ReversiGame.update({
						_id: this.gameId
					}, {
							$set: {
								isEnded: true,
								winnerId: winner
							}
						});

					publishReversiGameStream(this.gameId, 'ended', {
						winnerId: winner,
						game: await pack(this.gameId, this.user)
					});
				}
				//#endregion

				publishReversiGameStream(this.gameId, 'started', await pack(this.gameId, this.user));
			}, 3000);
		}
	}

	// 石を打つ
	@autobind
	private async set(pos: number) {
		const game = await ReversiGame.findOne({ _id: this.gameId });

		if (!game.isStarted) return;
		if (game.isEnded) return;
		if (!game.user1Id.equals(this.user._id) && !game.user2Id.equals(this.user._id)) return;

		const o = new Reversi(game.settings.map, {
			isLlotheo: game.settings.isLlotheo,
			canPutEverywhere: game.settings.canPutEverywhere,
			loopedBoard: game.settings.loopedBoard
		});

		game.logs.forEach(log => {
			o.put(log.color, log.pos);
		});

		const myColor =
			(game.user1Id.equals(this.user._id) && game.black == 1) || (game.user2Id.equals(this.user._id) && game.black == 2)
				? true
				: false;

		if (!o.canPut(myColor, pos)) return;
		o.put(myColor, pos);

		let winner;
		if (o.isEnded) {
			if (o.winner === true) {
				winner = game.black == 1 ? game.user1Id : game.user2Id;
			} else if (o.winner === false) {
				winner = game.black == 1 ? game.user2Id : game.user1Id;
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

		await ReversiGame.update({
			_id: this.gameId
		}, {
				$set: {
					crc32,
					isEnded: o.isEnded,
					winnerId: winner
				},
				$push: {
					logs: log
				}
			});

		publishReversiGameStream(this.gameId, 'set', Object.assign(log, {
			next: o.turn
		}));

		if (o.isEnded) {
			publishReversiGameStream(this.gameId, 'ended', {
				winnerId: winner,
				game: await pack(this.gameId, this.user)
			});
		}
	}

	@autobind
	private async check(crc32: string) {
		const game = await ReversiGame.findOne({ _id: this.gameId });

		if (!game.isStarted) return;

		// 互換性のため
		if (game.crc32 == null) return;

		if (crc32 !== game.crc32) {
			this.send('rescue', await pack(game, this.user));
		}
	}
}
