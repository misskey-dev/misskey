/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In, Not } from 'typeorm';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import {
	MiWorldRoom,
} from '@/models/_.js';
import type { WorldRoomsRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import type { MiUser } from '@/models/User.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { QueryService } from '@/core/QueryService.js';

type PlayerState = {
	position: [number, number, number],
	rotation: [number, number, number],
	sit?: string; // id
};

@Injectable()
export class WorldRoomMultiplayService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.worldRoomsRepository)
		private worldRoomsRepository: WorldRoomsRepository,

		private roleService: RoleService,
		private queryService: QueryService,
		private idService: IdService,
	) {
	}

	@bindThis
	public async enter(userId: MiUser['id'], roomId: MiWorldRoom['id']) {
		// TODO: atomicにやる
		const currentPlayers = await this.redisClient.hlen(`worldRoom:${roomId}:players`);
		if (currentPlayers < 10) {
			const redisPipeline = this.redisClient.pipeline();
			redisPipeline.hset(`worldRoom:${roomId}:players`, userId, 1);
			redisPipeline.hexpire(`worldRoom:${roomId}:players`, 30, 'FIELDS', 1, userId);
			await redisPipeline.exec();
		} else {
			throw new Error('Room is full.');
		}
	}

	@bindThis
	public async heartbeat(userId: MiUser['id'], roomId: MiWorldRoom['id']) {
		const exists = await this.redisClient.hexists(`worldRoom:${roomId}:players`, userId);
		if (exists) {
			const redisPipeline = this.redisClient.pipeline();
			redisPipeline.hexpire(`worldRoom:${roomId}:players`, 30, 'FIELDS', 1, userId);
			redisPipeline.hexpire(`worldRoom:${roomId}:playerStates`, 30, 'FIELDS', 1, userId);
			await redisPipeline.exec();
		} else {
			throw new Error('Not in room.');
		}
	}

	@bindThis
	public async leave(userId: MiUser['id'], roomId: MiWorldRoom['id']) {
		const redisPipeline = this.redisClient.pipeline();
		redisPipeline.hdel(`worldRoom:${roomId}:players`, userId);
		redisPipeline.hdel(`worldRoom:${roomId}:playerStates`, userId);
		await redisPipeline.exec();
	}

	@bindThis
	public async updatePlayerState(userId: MiUser['id'], roomId: MiWorldRoom['id'], state: PlayerState) {
		const redisPipeline = this.redisClient.pipeline();
		redisPipeline.hset(`worldRoom:${roomId}:playerStates`, userId, JSON.stringify(state));
		redisPipeline.hexpire(`worldRoom:${roomId}:playerStates`, 30, 'FIELDS', 1, userId);
		await redisPipeline.exec();
	}

	@bindThis
	public async getPlayerStates(roomId: MiWorldRoom['id']): Promise<Record<string, PlayerState>> {
		const entries = await this.redisClient.hgetall(`worldRoom:${roomId}:playerStates`);
		return Object.fromEntries(Object.entries(entries).map(([userId, state]) => [userId, JSON.parse(state) as PlayerState]));
	}

	@bindThis
	public getPlayerStatesAndHeatbeat(userId: MiUser['id'], roomId: MiWorldRoom['id']): Promise<Record<string, PlayerState>> {
		// TODO: atomicにやる
		this.heartbeat(userId, roomId);
		return this.getPlayerStates(roomId);
	}
}
