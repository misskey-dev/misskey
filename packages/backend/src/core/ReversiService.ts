/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import * as CRC32 from 'crc-32';
import { ModuleRef } from '@nestjs/core';
import * as Reversi from 'misskey-reversi';
import type {
	MiReversiGame,
	ReversiGamesRepository,
	ReversiMatchingsRepository,
	UsersRepository,
} from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { MetaService } from '@/core/MetaService.js';
import { CacheService } from '@/core/CacheService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { IdService } from '@/core/IdService.js';
import type { Packed } from '@/misc/json-schema.js';
import { NotificationService } from '@/core/NotificationService.js';
import { ReversiMatchingEntityService } from '@/core/entities/ReversiMatchingEntityService.js';
import { ReversiGameEntityService } from './entities/ReversiGameEntityService.js';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';

@Injectable()
export class ReversiService implements OnApplicationShutdown, OnModuleInit {
	private notificationService: NotificationService;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.reversiGamesRepository)
		private reversiGamesRepository: ReversiGamesRepository,

		@Inject(DI.reversiMatchingsRepository)
		private reversiMatchingsRepository: ReversiMatchingsRepository,

		private cacheService: CacheService,
		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
		private reversiGameEntityService: ReversiGameEntityService,
		private reversiMatchingsEntityService: ReversiMatchingEntityService,
		private idService: IdService,
	) {
	}

	async onModuleInit() {
		this.notificationService = this.moduleRef.get(NotificationService.name);
	}

	@bindThis
	public async match(me: MiUser, targetUser: MiUser): Promise<MiReversiGame | null> {
		if (targetUser.id === me.id) {
			throw new Error('You cannot match yourself.');
		}

		const exist = await this.reversiMatchingsRepository.findOneBy({
			parentId: targetUser.id,
			childId: me.id,
		});

		if (exist) {
			this.reversiMatchingsRepository.delete(exist.id);

			const game = await this.reversiGamesRepository.insert({
				id: this.idService.gen(),
				user1Id: exist.parentId,
				user2Id: me.id,
				user1Accepted: false,
				user2Accepted: false,
				isStarted: false,
				isEnded: false,
				logs: [],
				map: Reversi.maps.eighteight.data,
				bw: 'random',
				isLlotheo: false,
			}).then(x => this.reversiGamesRepository.findOneByOrFail(x.identifiers[0]));

			const packed = await this.reversiGameEntityService.pack(game, { id: exist.parentId });
			this.globalEventService.publishReversiStream(exist.parentId, 'matched', { game: packed });

			const other = await this.reversiMatchingsRepository.countBy({
				childId: me.id,
			});

			return game;
		} else {
			const child = targetUser;

			await this.reversiMatchingsRepository.delete({
				parentId: me.id,
			});

			const matching = await this.reversiMatchingsRepository.insert({
				id: this.idService.gen(),
				parentId: me.id,
				childId: child.id,
			}).then(x => this.reversiMatchingsRepository.findOneByOrFail(x.identifiers[0]));

			const packed = await this.reversiMatchingsEntityService.pack(matching, child);
			this.globalEventService.publishReversiStream(child.id, 'invited', { game: packed });

			return null;
		}
	}

	@bindThis
	public async matchCancel(user: MiUser) {
		await this.reversiMatchingsRepository.delete({
			parentId: user.id,
		});
	}

	@bindThis
	public async matchAccept(game: MiReversiGame, user: MiUser, isAccepted: boolean) {
		if (game.isStarted) return;

		let bothAccepted = false;

		if (game.user1Id === user.id) {
			await this.reversiGamesRepository.update(game.id, {
				user1Accepted: isAccepted,
			});

			this.globalEventService.publishReversiGameStream(game.id, 'changeAcceptingStates', {
				user1: isAccepted,
				user2: game.user2Accepted,
			});

			if (isAccepted && game.user2Accepted) bothAccepted = true;
		} else if (game.user2Id === user.id) {
			await this.reversiGamesRepository.update(game.id, {
				user2Accepted: isAccepted,
			});

			this.globalEventService.publishReversiGameStream(game.id, 'changeAcceptingStates', {
				user1: game.user1Accepted,
				user2: isAccepted,
			});

			if (isAccepted && game.user1Accepted) bothAccepted = true;
		} else {
			return;
		}

		if (bothAccepted) {
			// 3秒後、まだacceptされていたらゲーム開始
			setTimeout(async () => {
				const freshGame = await this.reversiGamesRepository.findOneBy({ id: game.id });
				if (freshGame == null || freshGame.isStarted || freshGame.isEnded) return;
				if (!freshGame.user1Accepted || !freshGame.user2Accepted) return;

				let bw: number;
				if (freshGame.bw === 'random') {
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

				await this.reversiGamesRepository.update(game.id, {
					startedAt: new Date(),
					isStarted: true,
					black: bw,
					map: map,
				});

				//#region 盤面に最初から石がないなどして始まった瞬間に勝敗が決定する場合があるのでその処理
				const o = new Reversi.Game(map, {
					isLlotheo: freshGame.isLlotheo,
					canPutEverywhere: freshGame.canPutEverywhere,
					loopedBoard: freshGame.loopedBoard,
				});

				if (o.isEnded) {
					let winner;
					if (o.winner === true) {
						winner = freshGame.black === 1 ? freshGame.user1Id : freshGame.user2Id;
					} else if (o.winner === false) {
						winner = freshGame.black === 1 ? freshGame.user2Id : freshGame.user1Id;
					} else {
						winner = null;
					}

					await this.reversiGamesRepository.update(game.id, {
						isEnded: true,
						winnerId: winner,
					});

					this.globalEventService.publishReversiGameStream(game.id, 'ended', {
						winnerId: winner,
						game: await this.reversiGameEntityService.pack(game.id, user),
					});
				}
				//#endregion

				this.globalEventService.publishReversiGameStream(game.id, 'started', {
					game: await this.reversiGameEntityService.pack(game.id, user),
				});
			}, 3000);
		}
	}

	@bindThis
	public async updateSettings(game: MiReversiGame, user: MiUser, key: string, value: any) {
		if (game.isStarted) return;
		if ((game.user1Id !== user.id) && (game.user2Id !== user.id)) return;
		if ((game.user1Id === user.id) && game.user1Accepted) return;
		if ((game.user2Id === user.id) && game.user2Accepted) return;

		if (!['map', 'bw', 'isLlotheo', 'canPutEverywhere', 'loopedBoard'].includes(key)) return;

		await this.reversiGamesRepository.update(game.id, {
			[key]: value,
		});

		this.globalEventService.publishReversiGameStream(game.id, 'updateSettings', {
			key: key,
			value: value,
		});
	}

	@bindThis
	public async putStoneToGame(game: MiReversiGame, user: MiUser, pos: number) {
		if (!game.isStarted) return;
		if (game.isEnded) return;
		if ((game.user1Id !== user.id) && (game.user2Id !== user.id)) return;

		const myColor =
			((game.user1Id === user.id) && game.black === 1) || ((game.user2Id === user.id) && game.black === 2)
				? true
				: false;

		const o = new Reversi.Game(game.map, {
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

		await this.reversiGamesRepository.update(game.id, {
			crc32,
			isEnded: o.isEnded,
			winnerId: winner,
			logs: game.logs,
		});

		this.globalEventService.publishReversiGameStream(game.id, 'set', Object.assign(log, {
			next: o.turn,
		}));

		if (o.isEnded) {
			this.globalEventService.publishReversiGameStream(game.id, 'ended', {
				winnerId: winner,
				game: await this.reversiGameEntityService.pack(game.id, user),
			});
		}
	}

	@bindThis
	public async get(id: MiReversiGame['id']) {
		return this.reversiGamesRepository.findOneBy({ id });
	}

	@bindThis
	public dispose(): void {
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
