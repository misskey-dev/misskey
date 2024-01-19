/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import CRC32 from 'crc-32';
import { ModuleRef } from '@nestjs/core';
import * as Reversi from 'misskey-reversi';
import { IsNull } from 'typeorm';
import type {
	MiReversiGame,
	ReversiGamesRepository,
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
import { ReversiGameEntityService } from './entities/ReversiGameEntityService.js';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';

const MATCHING_TIMEOUT_MS = 1000 * 15; // 15sec

@Injectable()
export class ReversiService implements OnApplicationShutdown, OnModuleInit {
	private notificationService: NotificationService;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.reversiGamesRepository)
		private reversiGamesRepository: ReversiGamesRepository,

		private cacheService: CacheService,
		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
		private reversiGameEntityService: ReversiGameEntityService,
		private idService: IdService,
	) {
	}

	async onModuleInit() {
		this.notificationService = this.moduleRef.get(NotificationService.name);
	}

	@bindThis
	public async matchSpecificUser(me: MiUser, targetUser: MiUser): Promise<MiReversiGame | null> {
		if (targetUser.id === me.id) {
			throw new Error('You cannot match yourself.');
		}

		const invitations = await this.redisClient.zrange(
			`reversi:matchSpecific:${me.id}`,
			Date.now() - MATCHING_TIMEOUT_MS,
			'+inf',
			'BYSCORE');

		if (invitations.includes(targetUser.id)) {
			await this.redisClient.zrem(`reversi:matchSpecific:${me.id}`, targetUser.id);

			const game = await this.reversiGamesRepository.insert({
				id: this.idService.gen(),
				user1Id: targetUser.id,
				user2Id: me.id,
				user1Ready: false,
				user2Ready: false,
				isStarted: false,
				isEnded: false,
				logs: [],
				map: Reversi.maps.eighteight.data,
				bw: 'random',
				isLlotheo: false,
			}).then(x => this.reversiGamesRepository.findOneByOrFail(x.identifiers[0]));

			const packed = await this.reversiGameEntityService.packDetail(game, { id: targetUser.id });
			this.globalEventService.publishReversiStream(targetUser.id, 'matched', { game: packed });

			return game;
		} else {
			this.redisClient.zadd(`reversi:matchSpecific:${targetUser.id}`, Date.now(), me.id);

			this.globalEventService.publishReversiStream(targetUser.id, 'invited', {
				user: await this.userEntityService.pack(me, targetUser),
			});

			return null;
		}
	}

	@bindThis
	public async matchAnyUser(me: MiUser): Promise<MiReversiGame | null> {
		//#region まず自分宛ての招待を探す
		const invitations = await this.redisClient.zrange(
			`reversi:matchSpecific:${me.id}`,
			Date.now() - MATCHING_TIMEOUT_MS,
			'+inf',
			'BYSCORE');

		if (invitations.length > 0) {
			const invitorId = invitations[Math.floor(Math.random() * invitations.length)];
			await this.redisClient.zrem(`reversi:matchSpecific:${me.id}`, invitorId);

			const game = await this.reversiGamesRepository.insert({
				id: this.idService.gen(),
				user1Id: invitorId,
				user2Id: me.id,
				user1Ready: false,
				user2Ready: false,
				isStarted: false,
				isEnded: false,
				logs: [],
				map: Reversi.maps.eighteight.data,
				bw: 'random',
				isLlotheo: false,
			}).then(x => this.reversiGamesRepository.findOneByOrFail(x.identifiers[0]));

			const packed = await this.reversiGameEntityService.packDetail(game, { id: invitorId });
			this.globalEventService.publishReversiStream(invitorId, 'matched', { game: packed });

			return game;
		}
		//#endregion

		const matchings = await this.redisClient.zrange(
			'reversi:matchAny',
			Date.now() - MATCHING_TIMEOUT_MS,
			'+inf',
			'BYSCORE');

		const userIds = matchings.filter(id => id !== me.id);

		if (userIds.length > 0) {
			// pick random
			const matchedUserId = userIds[Math.floor(Math.random() * userIds.length)];

			await this.redisClient.zrem('reversi:matchAny', me.id, matchedUserId);

			const game = await this.reversiGamesRepository.insert({
				id: this.idService.gen(),
				user1Id: matchedUserId,
				user2Id: me.id,
				user1Ready: false,
				user2Ready: false,
				isStarted: false,
				isEnded: false,
				logs: [],
				map: Reversi.maps.eighteight.data,
				bw: 'random',
				isLlotheo: false,
			}).then(x => this.reversiGamesRepository.findOneByOrFail(x.identifiers[0]));

			const packed = await this.reversiGameEntityService.packDetail(game, { id: matchedUserId });
			this.globalEventService.publishReversiStream(matchedUserId, 'matched', { game: packed });

			return game;
		} else {
			await this.redisClient.zadd('reversi:matchAny', Date.now(), me.id);
			return null;
		}
	}

	@bindThis
	public async matchSpecificUserCancel(user: MiUser, targetUserId: MiUser['id']) {
		await this.redisClient.zrem(`reversi:matchSpecific:${targetUserId}`, user.id);
	}

	@bindThis
	public async matchAnyUserCancel(user: MiUser) {
		await this.redisClient.zrem('reversi:matchAny', user.id);
	}

	@bindThis
	public async gameReady(game: MiReversiGame, user: MiUser, ready: boolean) {
		if (game.isStarted) return;

		let isBothReady = false;

		if (game.user1Id === user.id) {
			await this.reversiGamesRepository.update(game.id, {
				user1Ready: ready,
			});

			this.globalEventService.publishReversiGameStream(game.id, 'changeReadyStates', {
				user1: ready,
				user2: game.user2Ready,
			});

			if (ready && game.user2Ready) isBothReady = true;
		} else if (game.user2Id === user.id) {
			await this.reversiGamesRepository.update(game.id, {
				user2Ready: ready,
			});

			this.globalEventService.publishReversiGameStream(game.id, 'changeReadyStates', {
				user1: game.user1Ready,
				user2: ready,
			});

			if (ready && game.user1Ready) isBothReady = true;
		} else {
			return;
		}

		if (isBothReady) {
			// 3秒後、両者readyならゲーム開始
			setTimeout(async () => {
				const freshGame = await this.reversiGamesRepository.findOneBy({ id: game.id });
				if (freshGame == null || freshGame.isStarted || freshGame.isEnded) return;
				if (!freshGame.user1Ready || !freshGame.user2Ready) return;

				let bw: number;
				if (freshGame.bw === 'random') {
					bw = Math.random() > 0.5 ? 1 : 2;
				} else {
					bw = parseInt(freshGame.bw, 10);
				}

				function getRandomMap() {
					const mapCount = Object.entries(Reversi.maps).length;
					const rnd = Math.floor(Math.random() * mapCount);
					return Object.values(Reversi.maps)[rnd].data;
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
						game: await this.reversiGameEntityService.packDetail(game.id, user),
					});
				}
				//#endregion

				this.globalEventService.publishReversiGameStream(game.id, 'started', {
					game: await this.reversiGameEntityService.packDetail(game.id, user),
				});
			}, 3000);
		}
	}

	@bindThis
	public async getInvitations(user: MiUser): Promise<MiUser['id'][]> {
		const invitations = await this.redisClient.zrange(
			`reversi:matchSpecific:${user.id}`,
			Date.now() - MATCHING_TIMEOUT_MS,
			'+inf',
			'BYSCORE');
		return invitations;
	}

	@bindThis
	public async updateSettings(game: MiReversiGame, user: MiUser, key: string, value: any) {
		if (game.isStarted) return;
		if ((game.user1Id !== user.id) && (game.user2Id !== user.id)) return;
		if ((game.user1Id === user.id) && game.user1Ready) return;
		if ((game.user2Id === user.id) && game.user2Ready) return;

		if (!['map', 'bw', 'isLlotheo', 'canPutEverywhere', 'loopedBoard'].includes(key)) return;

		await this.reversiGamesRepository.update(game.id, {
			[key]: value,
		});

		this.globalEventService.publishReversiGameStream(game.id, 'updateSettings', {
			userId: user.id,
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
			at: Date.now(),
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

		this.globalEventService.publishReversiGameStream(game.id, 'putStone', {
			...log,
			next: o.turn,
		});

		if (o.isEnded) {
			this.globalEventService.publishReversiGameStream(game.id, 'ended', {
				winnerId: winner,
				game: await this.reversiGameEntityService.packDetail(game.id, user),
			});
		}
	}

	@bindThis
	public async surrender(game: MiReversiGame, user: MiUser) {
		if (game.isEnded) return;
		if ((game.user1Id !== user.id) && (game.user2Id !== user.id)) return;

		const winnerId = game.user1Id === user.id ? game.user2Id : game.user1Id;

		await this.reversiGamesRepository.update(game.id, {
			surrendered: user.id,
			isEnded: true,
			winnerId: winnerId,
		});

		this.globalEventService.publishReversiGameStream(game.id, 'ended', {
			winnerId: winnerId,
			game: await this.reversiGameEntityService.packDetail(game.id, user),
		});
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
