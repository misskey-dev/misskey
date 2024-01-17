/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as CRC32 from 'crc-32';
import type { MiReversiGame, MiUser, ReversiGamesRepository } from '@/models/_.js';
import type { Packed } from '@/misc/json-schema.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import Channel, { type MiChannelService } from '../channel.js';

class ReversiGameChannel extends Channel {
	public readonly chName = 'reversiGame';
	public static shouldShare = false;
	public static requireCredential = false as const;
	private gameId: MiReversiGame['id'] | null = null;

	constructor(
		private reversiGamesRepository: ReversiGamesRepository,

		id: string,
		connection: Channel['connection'],
	) {
		super(id, connection);
	}

	@bindThis
	public async init(params: any) {
		this.gameId = params.gameId as string;

		const game = await this.reversiGamesRepository.findOneBy({
			id: this.gameId,
		});
		if (game == null) return;

		this.subscriber.on(`reversiGameStream:${this.gameId}`, this.send);
	}

	@bindThis
	public onMessage(type: string, body: any) {
		switch (type) {
			case 'accept': this.accept(true); break;
			case 'cancelAccept': this.accept(false); break;
			case 'updateSettings': this.updateSettings(body.key, body.value); break;
			case 'initForm': this.initForm(body); break;
			case 'updateForm': this.updateForm(body.id, body.value); break;
			case 'message': this.message(body); break;
			case 'set': this.set(body.pos); break;
			case 'check': this.check(body.crc32); break;
		}
	}

	@bindThis
	private async updateSettings(key: string, value: any) {
		if (this.user == null) return;

		const game = await this.reversiGamesRepository.findOneBy({ id: this.gameId! });
		if (game == null) throw new Error('game not found');

		if (game.isStarted) return;
		if ((game.user1Id !== this.user.id) && (game.user2Id !== this.user.id)) return;
		if ((game.user1Id === this.user.id) && game.user1Accepted) return;
		if ((game.user2Id === this.user.id) && game.user2Accepted) return;

		if (!['map', 'bw', 'isLlotheo', 'canPutEverywhere', 'loopedBoard'].includes(key)) return;

		await this.reversiGamesRepository.update(this.gameId!, {
			[key]: value,
		});

		publishReversiGameStream(this.gameId!, 'updateSettings', {
			key: key,
			value: value,
		});
	}

	@bindThis
	private async initForm(form: any) {
		if (this.user == null) return;

		const game = await this.reversiGamesRepository.findOneBy({ id: this.gameId! });
		if (game == null) throw new Error('game not found');

		if (game.isStarted) return;
		if ((game.user1Id !== this.user.id) && (game.user2Id !== this.user.id)) return;

		const set = game.user1Id === this.user.id ? {
			form1: form,
		} : {
			form2: form,
		};

		await this.reversiGamesRepository.update(this.gameId!, set);

		publishReversiGameStream(this.gameId!, 'initForm', {
			userId: this.user.id,
			form,
		});
	}

	@bindThis
	private async updateForm(id: string, value: any) {
		if (this.user == null) return;

		const game = await this.reversiGamesRepository.findOneBy({ id: this.gameId! });
		if (game == null) throw new Error('game not found');

		if (game.isStarted) return;
		if ((game.user1Id !== this.user.id) && (game.user2Id !== this.user.id)) return;

		const form = game.user1Id === this.user.id ? game.form2 : game.form1;

		const item = form.find((i: any) => i.id == id);

		if (item == null) return;

		item.value = value;

		const set = game.user1Id === this.user.id ? {
			form2: form,
		} : {
			form1: form,
		};

		await this.reversiGamesRepository.update(this.gameId!, set);

		publishReversiGameStream(this.gameId!, 'updateForm', {
			userId: this.user.id,
			id,
			value,
		});
	}

	@bindThis
	private async message(message: any) {
		if (this.user == null) return;

		message.id = Math.random();
		publishReversiGameStream(this.gameId!, 'message', {
			userId: this.user.id,
			message,
		});
	}

	@bindThis
	private async accept(accept: boolean) {
		if (this.user == null) return;

		const game = await this.reversiGamesRepository.findOneBy({ id: this.gameId! });
		if (game == null) throw new Error('game not found');

		if (game.isStarted) return;

		let bothAccepted = false;

		if (game.user1Id === this.user.id) {
			await this.reversiGamesRepository.update(this.gameId!, {
				user1Accepted: accept,
			});

			publishReversiGameStream(this.gameId!, 'changeAccepts', {
				user1: accept,
				user2: game.user2Accepted,
			});

			if (accept && game.user2Accepted) bothAccepted = true;
		} else if (game.user2Id === this.user.id) {
			await this.reversiGamesRepository.update(this.gameId!, {
				user2Accepted: accept,
			});

			publishReversiGameStream(this.gameId!, 'changeAccepts', {
				user1: game.user1Accepted,
				user2: accept,
			});

			if (accept && game.user1Accepted) bothAccepted = true;
		} else {
			return;
		}

		if (bothAccepted) {
			// 3秒後、まだacceptされていたらゲーム開始
			setTimeout(async () => {
				const freshGame = await this.reversiGamesRepository.findOneBy({ id: this.gameId! });
				if (freshGame == null || freshGame.isStarted || freshGame.isEnded) return;
				if (!freshGame.user1Accepted || !freshGame.user2Accepted) return;

				let bw: number;
				if (freshGame.bw == 'random') {
					bw = Math.random() > 0.5 ? 1 : 2;
				} else {
					bw = parseInt(freshGame.bw, 10);
				}

				function getRandomMap() {
					const mapCount = Object.entries(maps).length;
					const rnd = Math.floor(Math.random() * mapCount);
					return Object.values(maps)[rnd].data;
				}

				const map = freshGame.map != null ? freshGame.map : getRandomMap();

				await this.reversiGamesRepository.update(this.gameId!, {
					startedAt: new Date(),
					isStarted: true,
					black: bw,
					map: map,
				});

				//#region 盤面に最初から石がないなどして始まった瞬間に勝敗が決定する場合があるのでその処理
				const o = new ReversiGame(map, {
					isLlotheo: freshGame.isLlotheo,
					canPutEverywhere: freshGame.canPutEverywhere,
					loopedBoard: freshGame.loopedBoard,
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

					await this.reversiGamesRepository.update(this.gameId!, {
						isEnded: true,
						winnerId: winner,
					});

					publishReversiGameStream(this.gameId!, 'ended', {
						winnerId: winner,
						game: await ReversiGames.pack(this.gameId!, this.user),
					});
				}
				//#endregion

				publishReversiGameStream(this.gameId!, 'started',
					await ReversiGames.pack(this.gameId!, this.user));
			}, 3000);
		}
	}

	@bindThis
	private async set(pos: number) {
		if (this.user == null) return;

		const game = await this.reversiGamesRepository.findOneBy({ id: this.gameId! });
		if (game == null) throw new Error('game not found');

		if (!game.isStarted) return;
		if (game.isEnded) return;
		if ((game.user1Id !== this.user.id) && (game.user2Id !== this.user.id)) return;

		const myColor =
			((game.user1Id === this.user.id) && game.black === 1) || ((game.user2Id === this.user.id) && game.black === 2)
				? true
				: false;

		const o = new ReversiGame(game.map, {
			isLlotheo: game.isLlotheo,
			canPutEverywhere: game.canPutEverywhere,
			loopedBoard: game.loopedBoard,
		});

		// 盤面の状態を再生
		for (const log of game.logs) {
			o.put(log.color, log.pos);
		}

		if (o.turn !== myColor) return;

		if (!o.canPut(myColor, pos)) return;
		o.put(myColor, pos);

		let winner;
		if (o.isEnded) {
			if (o.winner === true) {
				winner = game.black === 1 ? game.user1Id : game.user2Id;
			} else if (o.winner === false) {
				winner = game.black === 1 ? game.user2Id : game.user1Id;
			} else {
				winner = null;
			}
		}

		const log = {
			at: new Date(),
			color: myColor,
			pos,
		};

		const crc32 = CRC32.str(game.logs.map(x => x.pos.toString()).join('') + pos.toString()).toString();

		game.logs.push(log);

		await this.reversiGamesRepository.update(this.gameId!, {
			crc32,
			isEnded: o.isEnded,
			winnerId: winner,
			logs: game.logs,
		});

		publishReversiGameStream(this.gameId!, 'set', Object.assign(log, {
			next: o.turn,
		}));

		if (o.isEnded) {
			publishReversiGameStream(this.gameId!, 'ended', {
				winnerId: winner,
				game: await ReversiGames.pack(this.gameId!, this.user),
			});
		}
	}

	@bindThis
	private async check(crc32: string | number) {
		const game = await this.reversiGamesRepository.findOneBy({ id: this.gameId! });
		if (game == null) throw new Error('game not found');

		if (!game.isStarted) return;

		if (crc32.toString() !== game.crc32) {
			this.send('rescue', await ReversiGames.pack(game, this.user));
		}
	}

	@bindThis
	public dispose() {
		// Unsubscribe events
		this.subscriber.off(`reversiGameStream:${this.gameId}`, this.send);
	}
}

@Injectable()
export class ReversiGameChannelService implements MiChannelService<false> {
	public readonly shouldShare = ReversiGameChannel.shouldShare;
	public readonly requireCredential = ReversiGameChannel.requireCredential;
	public readonly kind = ReversiGameChannel.kind;

	constructor(
		@Inject(DI.reversiGamesRepository)
		private reversiGamesRepository: ReversiGamesRepository,
	) {
	}

	@bindThis
	public create(id: string, connection: Channel['connection']): ReversiGameChannel {
		return new ReversiGameChannel(
			this.reversiGamesRepository,
			id,
			connection,
		);
	}
}
