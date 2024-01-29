/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { ModuleRef } from '@nestjs/core';
import { IsNull, LessThan, MoreThan } from 'typeorm';
import * as Mahjong from 'misskey-mahjong';
import type {
	MiMahjongGame,
	MahjongGamesRepository,
} from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { CacheService } from '@/core/CacheService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { IdService } from '@/core/IdService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { Serialized } from '@/types.js';
import { Packed } from '@/misc/json-schema.js';
import { ReversiGameEntityService } from './entities/ReversiGameEntityService.js';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';

const INVITATION_TIMEOUT_MS = 1000 * 20; // 20sec
const CALL_AND_RON_ASKING_TIMEOUT_MS = 1000 * 5; // 5sec
const TURN_TIMEOUT_MS = 1000 * 30; // 30sec

type Room = {
	id: string;
	user1Id: MiUser['id'];
	user2Id: MiUser['id'] | null;
	user3Id: MiUser['id'] | null;
	user4Id: MiUser['id'] | null;
	user1: Packed<'UserLite'> | null;
	user2: Packed<'UserLite'> | null;
	user3: Packed<'UserLite'> | null;
	user4: Packed<'UserLite'> | null;
	user1Ai?: boolean;
	user2Ai?: boolean;
	user3Ai?: boolean;
	user4Ai?: boolean;
	user1Ready: boolean;
	user2Ready: boolean;
	user3Ready: boolean;
	user4Ready: boolean;
	user1Offline?: boolean;
	user2Offline?: boolean;
	user3Offline?: boolean;
	user4Offline?: boolean;
	isStarted?: boolean;
	timeLimitForEachTurn: number;

	gameState?: Mahjong.MasterState;
};

type CallAndRonAnswers = {
	pon: null | boolean;
	cii: null | boolean;
	kan: null | boolean;
	ron: {
		e: null | boolean;
		s: null | boolean;
		w: null | boolean;
		n: null | boolean;
	};
};

@Injectable()
export class MahjongService implements OnApplicationShutdown, OnModuleInit {
	private notificationService: NotificationService;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		//@Inject(DI.mahjongGamesRepository)
		//private mahjongGamesRepository: MahjongGamesRepository,

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
	private async saveRoom(room: Room) {
		await this.redisClient.set(`mahjong:room:${room.id}`, JSON.stringify(room), 'EX', 60 * 30);
	}

	@bindThis
	public async createRoom(user: MiUser): Promise<Room> {
		const room: Room = {
			id: this.idService.gen(),
			user1Id: user.id,
			user2Id: null,
			user3Id: null,
			user4Id: null,
			user1: await this.userEntityService.pack(user),
			user1Ready: false,
			user2Ready: false,
			user3Ready: false,
			user4Ready: false,
			timeLimitForEachTurn: 30,
		};
		await this.saveRoom(room);
		return room;
	}

	@bindThis
	public async getRoom(id: Room['id']): Promise<Room | null> {
		const room = await this.redisClient.get(`mahjong:room:${id}`);
		if (!room) return null;
		const parsed = JSON.parse(room);
		return {
			...parsed,
		};
	}

	@bindThis
	public async joinRoom(roomId: Room['id'], user: MiUser): Promise<Room | null> {
		const room = await this.getRoom(roomId);
		if (!room) return null;
		if (room.user1Id === user.id) return room;
		if (room.user2Id === user.id) return room;
		if (room.user3Id === user.id) return room;
		if (room.user4Id === user.id) return room;
		if (room.user2Id === null) {
			room.user2Id = user.id;
			room.user2 = await this.userEntityService.pack(user);
			await this.saveRoom(room);
			this.globalEventService.publishMahjongRoomStream(room.id, 'joined', { index: 2, user: room.user2 });
			return room;
		}
		if (room.user3Id === null) {
			room.user3Id = user.id;
			room.user3 = await this.userEntityService.pack(user);
			await this.saveRoom(room);
			this.globalEventService.publishMahjongRoomStream(room.id, 'joined', { index: 3, user: room.user3 });
			return room;
		}
		if (room.user4Id === null) {
			room.user4Id = user.id;
			room.user4 = await this.userEntityService.pack(user);
			await this.saveRoom(room);
			this.globalEventService.publishMahjongRoomStream(room.id, 'joined', { index: 4, user: room.user4 });
			return room;
		}

		return null;
	}

	@bindThis
	public async addAi(roomId: Room['id'], user: MiUser): Promise<Room | null> {
		const room = await this.getRoom(roomId);
		if (!room) return null;
		if (room.user1Id !== user.id) throw new Error('access denied');

		if (room.user2Id == null && !room.user2Ai) {
			room.user2Ai = true;
			room.user2Ready = true;
			await this.saveRoom(room);
			this.globalEventService.publishMahjongRoomStream(room.id, 'joined', { index: 2, user: null });
			return room;
		}
		if (room.user3Id == null && !room.user3Ai) {
			room.user3Ai = true;
			room.user3Ready = true;
			await this.saveRoom(room);
			this.globalEventService.publishMahjongRoomStream(room.id, 'joined', { index: 3, user: null });
			return room;
		}
		if (room.user4Id == null && !room.user4Ai) {
			room.user4Ai = true;
			room.user4Ready = true;
			await this.saveRoom(room);
			this.globalEventService.publishMahjongRoomStream(room.id, 'joined', { index: 4, user: null });
			return room;
		}

		return null;
	}

	@bindThis
	public async leaveRoom(roomId: Room['id'], user: MiUser): Promise<Room | null> {
		const room = await this.getRoom(roomId);
		if (!room) return null;
		if (room.user1Id === user.id) {
			room.user1Id = null;
			room.user1 = null;
			await this.saveRoom(room);
			return room;
		}
		if (room.user2Id === user.id) {
			room.user2Id = null;
			room.user2 = null;
			await this.saveRoom(room);
			return room;
		}
		if (room.user3Id === user.id) {
			room.user3Id = null;
			room.user3 = null;
			await this.saveRoom(room);
			return room;
		}
		if (room.user4Id === user.id) {
			room.user4Id = null;
			room.user4 = null;
			await this.saveRoom(room);
			return room;
		}
		return null;
	}

	@bindThis
	public async changeReadyState(roomId: Room['id'], user: MiUser, ready: boolean): Promise<void> {
		const room = await this.getRoom(roomId);
		if (!room) return;

		if (room.user1Id === user.id) {
			room.user1Ready = ready;
			await this.saveRoom(room);
		}
		if (room.user2Id === user.id) {
			room.user2Ready = ready;
			await this.saveRoom(room);
		}
		if (room.user3Id === user.id) {
			room.user3Ready = ready;
			await this.saveRoom(room);
		}
		if (room.user4Id === user.id) {
			room.user4Ready = ready;
			await this.saveRoom(room);
		}

		this.globalEventService.publishMahjongRoomStream(room.id, 'changeReadyStates', {
			user1: room.user1Ready,
			user2: room.user2Ready,
			user3: room.user3Ready,
			user4: room.user4Ready,
		});

		if (room.user1Ready && room.user2Ready && room.user3Ready && room.user4Ready) {
			await this.startGame(room);
		}
	}

	@bindThis
	public async startGame(room: Room) {
		if (!room.user1Ready || !room.user2Ready || !room.user3Ready || !room.user4Ready) {
			throw new Error('Not ready');
		}

		room.gameState = Mahjong.MasterGameEngine.createInitialState();
		room.isStarted = true;

		await this.saveRoom(room);

		const packed = await this.packRoom(room);
		this.globalEventService.publishMahjongRoomStream(room.id, 'started', { room: packed });

		return room;
	}

	@bindThis
	public async packRoom(room: Room, me: MiUser) {
		return {
			...room,
		};
	}

	@bindThis
	private async answer(room: Room, engine: Mahjong.MasterGameEngine, answers: CallAndRonAnswers) {
		const res = engine.commit_resolveCallAndRonInterruption({
			pon: answers.pon ?? false,
			cii: answers.cii ?? false,
			kan: answers.kan ?? false,
			ron: [...(answers.ron.e ? ['e'] : []), ...(answers.ron.s ? ['s'] : []), ...(answers.ron.w ? ['w'] : []), ...(answers.ron.n ? ['n'] : [])],
		});
		room.gameState = engine.state;
		await this.saveRoom(room);

		if (res.type === 'tsumo') {
			this.globalEventService.publishMahjongRoomStream(room.id, 'tsumo', { house: res.house, tile: res.tile });
			this.next(room, engine);
		} else if (res.type === 'ponned') {
			this.globalEventService.publishMahjongRoomStream(room.id, 'ponned', { source: res.source, target: res.target, tile: res.tile });
			const userId = engine.state.user1House === engine.state.turn ? room.user1Id : engine.state.user2House === engine.state.turn ? room.user2Id : engine.state.user3House === engine.state.turn ? room.user3Id : room.user4Id;
			this.waitForTurn(room, userId, engine);
		} else if (res.type === 'kanned') {
			// TODO
		} else if (res.type === 'ronned') {
			// TODO
		}
	}

	@bindThis
	private async next(room: Room, engine: Mahjong.MasterGameEngine) {
		const aiHouses = [[1, room.user1Ai], [2, room.user2Ai], [3, room.user3Ai], [4, room.user4Ai]].filter(([id, ai]) => ai).map(([id, ai]) => engine.getHouse(id));
		const userId = engine.state.user1House === engine.state.turn ? room.user1Id : engine.state.user2House === engine.state.turn ? room.user2Id : engine.state.user3House === engine.state.turn ? room.user3Id : room.user4Id;

		if (aiHouses.includes(engine.state.turn)) {
			// TODO: ちゃんと思考するようにする
			setTimeout(() => {
				const house = engine.state.turn;
				this.dahai(room, engine, engine.state.turn, engine.state.handTiles[house].at(-1));
			}, 500);
		} else {
			if (engine.state.riichis[engine.state.turn]) {
				// リーチ時はアガリ牌でない限りツモ切り
				const handTiles = engine.state.handTiles[engine.state.turn];
				const horaSets = Mahjong.Utils.getHoraSets(handTiles);
				if (horaSets.length === 0) {
					setTimeout(() => {
						this.dahai(room, engine, engine.state.turn, handTiles.at(-1));
					}, 500);
				} else {
					this.waitForTurn(room, userId, engine);
				}
			} else {
				this.waitForTurn(room, userId, engine);
			}
		}
	}

	@bindThis
	private async endKyoku(room: Room, engine: Mahjong.MasterGameEngine) {
	}

	@bindThis
	private async dahai(room: Room, engine: Mahjong.MasterGameEngine, house: Mahjong.Common.House, tile: Mahjong.Common.Tile, riichi = false) {
		const res = engine.commit_dahai(house, tile, riichi);
		room.gameState = engine.state;
		await this.saveRoom(room);

		const aiHouses = [[1, room.user1Ai], [2, room.user2Ai], [3, room.user3Ai], [4, room.user4Ai]].filter(([id, ai]) => ai).map(([id, ai]) => engine.getHouse(id));

		if (res.asking) {
			console.log('asking', res);

			const answers: CallAndRonAnswers = {
				pon: null,
				cii: null,
				kan: null,
				ron: {
					e: null,
					s: null,
					w: null,
					n: null,
				},
			};

			// リーチ中はポン、チー、カンできない
			if (res.canPonHouse != null && engine.state.riichis[res.canPonHouse]) {
				answers.pon = false;
			}
			if (res.canCiiHouse != null && engine.state.riichis[res.canCiiHouse]) {
				answers.cii = false;
			}
			if (res.canKanHouse != null && engine.state.riichis[res.canKanHouse]) {
				answers.kan = false;
			}

			if (aiHouses.includes(res.canPonHouse)) {
				// TODO: ちゃんと思考するようにする
				//answers.pon = Math.random() < 0.25;
				answers.pon = false;
			}
			if (aiHouses.includes(res.canCiiHouse)) {
				// TODO: ちゃんと思考するようにする
				//answers.cii = Math.random() < 0.25;
				answers.cii = false;
			}
			if (aiHouses.includes(res.canKanHouse)) {
				// TODO: ちゃんと思考するようにする
				//answers.kan = Math.random() < 0.25;
				answers.kan = false;
			}
			for (const h of res.canRonHouses) {
				if (aiHouses.includes(h)) {
				// TODO: ちゃんと思考するようにする
				}
			}

			this.redisClient.set(`mahjong:gameCallAndRonAsking:${room.id}`, JSON.stringify(answers));
			const waitingStartedAt = Date.now();
			const interval = setInterval(async () => {
				const current = await this.redisClient.get(`mahjong:gameCallAndRonAsking:${room.id}`);
				if (current == null) throw new Error('arienai (gameCallAndRonAsking)');
				const currentAnswers = JSON.parse(current) as CallAndRonAnswers;
				const allAnswered = !(
					(res.canPonHouse != null && currentAnswers.pon == null) ||
					(res.canCiiHouse != null && currentAnswers.cii == null) ||
					(res.canKanHouse != null && currentAnswers.kan == null) ||
					(res.canRonHouses.includes('e') && currentAnswers.ron.e == null) ||
					(res.canRonHouses.includes('s') && currentAnswers.ron.s == null) ||
					(res.canRonHouses.includes('w') && currentAnswers.ron.w == null) ||
					(res.canRonHouses.includes('n') && currentAnswers.ron.n == null)
				);
				if (allAnswered || (Date.now() - waitingStartedAt > CALL_AND_RON_ASKING_TIMEOUT_MS)) {
					console.log(allAnswered ? 'ask all answerd' : 'ask timeout');
					await this.redisClient.del(`mahjong:gameCallAndRonAsking:${room.id}`);
					clearInterval(interval);
					this.answer(room, engine, currentAnswers);
					return;
				}
			}, 2000);

			this.globalEventService.publishMahjongRoomStream(room.id, 'dahai', { house: house, tile });
		} else {
			this.globalEventService.publishMahjongRoomStream(room.id, 'dahaiAndTsumo', { dahaiHouse: house, dahaiTile: tile, tsumoTile: res.tsumoTile });

			this.next(room, engine);
		}
	}

	@bindThis
	public async commit_dahai(roomId: MiMahjongGame['id'], user: MiUser, tile: string, riichi = false) {
		const room = await this.getRoom(roomId);
		if (room == null) return;
		if (room.gameState == null) return;
		if (!Mahjong.Utils.isTile(tile)) return;

		const engine = new Mahjong.MasterGameEngine(room.gameState);
		const myHouse = user.id === room.user1Id ? engine.state.user1House : user.id === room.user2Id ? engine.state.user2House : user.id === room.user3Id ? engine.state.user3House : engine.state.user4House;

		if (riichi) {
			if (Mahjong.Utils.getHoraTiles(engine.state.handTiles[myHouse]).length === 0) return;
			if (engine.state.points[myHouse] < 1000) return;
		}

		await this.clearTurnWaitingTimer(room.id);

		await this.dahai(room, engine, myHouse, tile);
	}

	@bindThis
	public async commit_ron(roomId: MiMahjongGame['id'], user: MiUser) {
		const room = await this.getRoom(roomId);
		if (room == null) return;
		if (room.gameState == null) return;

		const engine = new Mahjong.MasterGameEngine(room.gameState);
		const myHouse = user.id === room.user1Id ? engine.state.user1House : user.id === room.user2Id ? engine.state.user2House : user.id === room.user3Id ? engine.state.user3House : engine.state.user4House;

		// TODO: 自分にロン回答する権利がある状態かバリデーション

		// TODO: この辺の処理はアトミックに行いたいけどJSONサポートはRedis Stackが必要
		const current = await this.redisClient.get(`mahjong:gameCallAndRonAsking:${room.id}`);
		if (current == null) throw new Error('no asking found');
		const currentAnswers = JSON.parse(current) as CallAndRonAnswers;
		currentAnswers.ron[myHouse] = true;
		await this.redisClient.set(`mahjong:gameCallAndRonAsking:${room.id}`, JSON.stringify(currentAnswers));
	}

	@bindThis
	public async commit_pon(roomId: MiMahjongGame['id'], user: MiUser) {
		const room = await this.getRoom(roomId);
		if (room == null) return;
		if (room.gameState == null) return;

		const engine = new Mahjong.MasterGameEngine(room.gameState);
		const myHouse = user.id === room.user1Id ? engine.state.user1House : user.id === room.user2Id ? engine.state.user2House : user.id === room.user3Id ? engine.state.user3House : engine.state.user4House;

		// TODO: 自分にポン回答する権利がある状態かバリデーション

		// TODO: この辺の処理はアトミックに行いたいけどJSONサポートはRedis Stackが必要
		const current = await this.redisClient.get(`mahjong:gameCallAndRonAsking:${room.id}`);
		if (current == null) throw new Error('no asking found');
		const currentAnswers = JSON.parse(current) as CallAndRonAnswers;
		currentAnswers.pon = true;
		await this.redisClient.set(`mahjong:gameCallAndRonAsking:${room.id}`, JSON.stringify(currentAnswers));
	}

	@bindThis
	public async commit_nop(roomId: MiMahjongGame['id'], user: MiUser) {
		const room = await this.getRoom(roomId);
		if (room == null) return;
		if (room.gameState == null) return;

		const engine = new Mahjong.MasterGameEngine(room.gameState);
		const myHouse = user.id === room.user1Id ? engine.state.user1House : user.id === room.user2Id ? engine.state.user2House : user.id === room.user3Id ? engine.state.user3House : engine.state.user4House;

		// TODO: この辺の処理はアトミックに行いたいけどJSONサポートはRedis Stackが必要
		const current = await this.redisClient.get(`mahjong:gameCallAndRonAsking:${room.id}`);
		if (current == null) throw new Error('no asking found');
		const currentAnswers = JSON.parse(current) as CallAndRonAnswers;
		if (engine.state.ponAsking?.target === myHouse) currentAnswers.pon = false;
		if (engine.state.ciiAsking?.target === myHouse) currentAnswers.cii = false;
		if (engine.state.kanAsking?.target === myHouse) currentAnswers.kan = false;
		if (engine.state.ronAsking != null && engine.state.ronAsking.targets.includes(myHouse)) currentAnswers.ron[myHouse] = false;
		await this.redisClient.set(`mahjong:gameCallAndRonAsking:${room.id}`, JSON.stringify(currentAnswers));
	}

	/**
	 * プレイヤーの行動を待つ(打牌もしくはツモ和了)
	 * 制限時間が過ぎたらツモ切り
	 * NOTE: 時間切れチェックが行われたときにタイミングによっては次のwaitingが始まっている場合があることを考慮し、Setに一意のIDを格納する構造としている
	 * @param room
	 * @param userId
	 * @param engine
	 */
	@bindThis
	private async waitForTurn(room: Room, userId: MiUser['id'], engine: Mahjong.MasterGameEngine) {
		const id = Math.random().toString(36).slice(2);
		console.log('waitForTurn', userId, id);
		this.redisClient.sadd(`mahjong:gameTurnWaiting:${room.id}`, id);
		const waitingStartedAt = Date.now();
		const interval = setInterval(async () => {
			const waiting = await this.redisClient.sismember(`mahjong:gameTurnWaiting:${room.id}`, id);
			if (waiting === 0) {
				clearInterval(interval);
				return;
			}
			if (Date.now() - waitingStartedAt > TURN_TIMEOUT_MS) {
				await this.redisClient.srem(`mahjong:gameTurnWaiting:${room.id}`, id);
				console.log('turn timeout', userId, id);
				clearInterval(interval);
				const house = room.user1Id === userId ? engine.state.user1House : room.user2Id === userId ? engine.state.user2House : room.user3Id === userId ? engine.state.user3House : engine.state.user4House;
				const handTiles = engine.state.handTiles[house];
				await this.dahai(room, engine, house, handTiles.at(-1));
				return;
			}
		}, 2000);
	}

	/**
	 * プレイヤーが打牌またはツモ和了したら呼ぶ
	 * @param roomId
	 */
	@bindThis
	private async clearTurnWaitingTimer(roomId: Room['id']) {
		await this.redisClient.del(`mahjong:gameTurnWaiting:${roomId}`);
	}

	@bindThis
	public dispose(): void {
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
