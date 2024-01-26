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
const PON_TIMEOUT_MS = 1000 * 10; // 10sec
const DAHAI_TIMEOUT_MS = 1000 * 30; // 30sec

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

	gameState?: Mahjong.Engine.MasterState;
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

		if (room.user2Id == null) {
			room.user2Ai = true;
			room.user2Ready = true;
			await this.saveRoom(room);
			this.globalEventService.publishMahjongRoomStream(room.id, 'joined', { index: 2, user: null });
			return room;
		}
		if (room.user3Id == null) {
			room.user3Ai = true;
			room.user3Ready = true;
			await this.saveRoom(room);
			this.globalEventService.publishMahjongRoomStream(room.id, 'joined', { index: 3, user: null });
			return room;
		}
		if (room.user4Id == null) {
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

		room.gameState = Mahjong.Engine.MasterGameEngine.createInitialState();
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
	private async dahai(room: Room, engine: Mahjong.Engine.MasterGameEngine, user: MiUser, tile: Mahjong.Engine.Tile) {
		const myHouse = user.id === room.user1Id ? engine.state.user1House : user.id === room.user2Id ? engine.state.user2House : user.id === room.user3Id ? engine.state.user3House : engine.state.user4House;
		const res = engine.op_dahai(myHouse, tile);
		if (res.canPonHouse) {
			// TODO: 家がCPUだった場合の処理
			this.redisClient.set(`mahjong:gamePonAsking:${room.id}`, '');
			const waitingStartedAt = Date.now();
			const interval = setInterval(async () => {
				const waiting = await this.redisClient.get(`mahjong:gamePonAsking:${room.id}`);
				if (waiting == null) {
					clearInterval(interval);
					return;
				}
				if (Date.now() - waitingStartedAt > PON_TIMEOUT_MS) {
					await this.redisClient.del(`mahjong:gamePonAsking:${room.id}`);
					clearInterval(interval);
					const res = engine.op_noOnePon();
					this.globalEventService.publishMahjongRoomStream(room.id, 'tsumo', { house: res.house, tile: res.tile });
					return;
				}
			}, 2000);
			this.globalEventService.publishMahjongRoomStream(room.id, 'dahai', { house: myHouse, tile });
		} else {
			this.globalEventService.publishMahjongRoomStream(room.id, 'dahaiAndTsumo', { house: myHouse, dahaiTile: tile, tsumoTile: res.tsumoTile });
		}
	}

	@bindThis
	public async op_dahai(roomId: MiMahjongGame['id'], user: MiUser, tile: string) {
		const room = await this.getRoom(roomId);
		if (room == null) return;
		if (room.gameState == null) return;

		await this.redisClient.del(`mahjong:gameDahaiWaiting:${room.id}`);

		const engine = new Mahjong.Engine.MasterGameEngine(room.gameState);
		await this.dahai(room, engine, user, tile);
	}

	@bindThis
	public async op_pon(roomId: MiMahjongGame['id'], user: MiUser) {
		const room = await this.getRoom(roomId);
		if (room == null) return;
		if (room.gameState == null) return;

		const engine = new Mahjong.Engine.MasterGameEngine(room.gameState);
		const myHouse = user.id === room.user1Id ? engine.state.user1House : user.id === room.user2Id ? engine.state.user2House : user.id === room.user3Id ? engine.state.user3House : engine.state.user4House;
		const res = engine.op_pon(myHouse);
		this.waitForDahai(room, user, engine);
	}

	@bindThis
	private async waitForDahai(game: Room, user: MiUser, engine: Mahjong.Engine.MasterGameEngine) {
		this.redisClient.set(`mahjong:gameDahaiWaiting:${game.id}`, '');
		const waitingStartedAt = Date.now();
		const interval = setInterval(async () => {
			const waiting = await this.redisClient.get(`mahjong:gameDahaiWaiting:${game.id}`);
			if (waiting == null) {
				clearInterval(interval);
				return;
			}
			if (Date.now() - waitingStartedAt > DAHAI_TIMEOUT_MS) {
				await this.redisClient.del(`mahjong:gameDahaiWaiting:${game.id}`);
				clearInterval(interval);
				const house = game.user1Id === user.id ? engine.state.user1House : game.user2Id === user.id ? engine.state.user2House : game.user3Id === user.id ? engine.state.user3House : engine.state.user4House;
				const handTiles = house === 'e' ? engine.state.eHandTiles : house === 's' ? engine.state.sHandTiles : house === 'w' ? engine.state.wHandTiles : engine.state.nHandTiles;
				await this.dahai(game, engine, user, handTiles.at(-1));
				return;
			}
		}, 2000);
	}

	@bindThis
	public dispose(): void {
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
