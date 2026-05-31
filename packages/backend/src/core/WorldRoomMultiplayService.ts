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
import type { MiWorldAvatar, WorldRoomsRepository } from '@/models/_.js';
import { bindThis } from '@/decorators.js';
import { RoleService } from '@/core/RoleService.js';
import { IdService } from '@/core/IdService.js';
import type { MiUser } from '@/models/User.js';
import { IdentifiableError } from '@/misc/identifiable-error.js';
import { QueryService } from '@/core/QueryService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import type { Packed } from '@/misc/json-schema.js';
import { WorldAvatarService } from '@/core/WorldAvatarService.js';
import { WorldAvatarEntityService } from '@/core/entities/WorldAvatarEntityService.js';

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
		private globalEventService: GlobalEventService,
		private userEntityService: UserEntityService,
		private worldAvatarService: WorldAvatarService,
		private worldAvatarEntityService: WorldAvatarEntityService,
	) {
	}

	@bindThis
	public async enter(userId: MiUser['id'], roomId: MiWorldRoom['id']) {
		console.log('enter', { userId, roomId });

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

		// TODO: 既に入っていたらスキップ
		const avatar = await this.worldAvatarService.getActiveAvatarOfUser(userId);
		this.globalEventService.publishWorldRoomStream(roomId, 'enter', {
			user: await this.userEntityService.pack(userId),
			avatar: avatar?.def,
		});
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
	public async left(userId: MiUser['id'], roomId: MiWorldRoom['id']) {
		console.log('left', { userId, roomId });

		const redisPipeline = this.redisClient.pipeline();
		redisPipeline.hdel(`worldRoom:${roomId}:players`, userId);
		redisPipeline.hdel(`worldRoom:${roomId}:playerStates`, userId);
		await redisPipeline.exec();

		this.globalEventService.publishWorldRoomStream(roomId, 'left', {
			userId,
		});
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

	@bindThis
	public packPlayerProfile(user: Packed<'UserLite'>, avatar: Packed<'WorldAvatarLite'>['def'] | null) {
		return {
			user: {
				name: user.name,
				username: user.username,
				avatarUrl: user.avatarUrl,
			},
			avatar: avatar ?? this.worldAvatarService.defaultAvatar,
		};
	}

	@bindThis
	public async getPlayerProfiles(roomId: MiWorldRoom['id'], userId?: MiUser['id']): Promise<Record<string, any>> {
		let playerIds = await this.redisClient.hkeys(`worldRoom:${roomId}:players`);
		playerIds = playerIds.filter(id => id !== userId);

		const packedUsers = await this.userEntityService.packMany(playerIds);
		const avatars = await this.worldAvatarService.getActiveAvatarOfUsers(playerIds);

		const profiles: Record<string, any> = {};
		for (const playerId of playerIds) {
			const packedUser = packedUsers.find(u => u.id === playerId);
			if (packedUser == null) continue;
			profiles[playerId] = this.packPlayerProfile(packedUser, avatars.find(a => a.userId === playerId)?.def ?? null);
		}
		return profiles;
	}
}
