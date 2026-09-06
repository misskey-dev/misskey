/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource, In, Not } from 'typeorm';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
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
export class WorldMultiplayService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

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
	public async enter(userId: MiUser['id'], spaceKey: string) {
		// TODO: 同じユーザーが同時に複数のspacedに入れないようにする

		// TODO: atomicにやる
		const currentPlayers = await this.redisClient.hlen(`world:${spaceKey}:players`);
		if (currentPlayers < 50) {
			const redisPipeline = this.redisClient.pipeline();
			redisPipeline.hset(`world:${spaceKey}:players`, userId, 1);
			redisPipeline.hexpire(`world:${spaceKey}:players`, 30, 'FIELDS', 1, userId);
			await redisPipeline.exec();
		} else {
			throw new Error('The group is full.');
		}

		// TODO: 既に入っていたらスキップ
		const avatar = await this.worldAvatarService.getActiveAvatarOfUser(userId);
		this.globalEventService.publishWorldStream(spaceKey, 'enter', {
			user: await this.userEntityService.pack(userId),
			avatar: avatar?.def,
		});
	}

	@bindThis
	public async heartbeat(userId: MiUser['id'], spaceKey: string) {
		const exists = await this.redisClient.hexists(`world:${spaceKey}:players`, userId);
		if (exists) {
			const redisPipeline = this.redisClient.pipeline();
			redisPipeline.hexpire(`world:${spaceKey}:players`, 30, 'FIELDS', 1, userId);
			redisPipeline.hexpire(`world:${spaceKey}:playerStates`, 30, 'FIELDS', 1, userId);
			await redisPipeline.exec();
		} else {
			throw new Error('Not in the group.');
		}
	}

	@bindThis
	public async left(userId: MiUser['id'], spaceKey: string) {
		const redisPipeline = this.redisClient.pipeline();
		redisPipeline.hdel(`world:${spaceKey}:players`, userId);
		redisPipeline.hdel(`world:${spaceKey}:playerStates`, userId);
		await redisPipeline.exec();

		this.globalEventService.publishWorldStream(spaceKey, 'left', {
			userId,
		});
	}

	@bindThis
	public async updatePlayerState(userId: MiUser['id'], spaceKey: string, state: PlayerState) {
		const redisPipeline = this.redisClient.pipeline();
		redisPipeline.hset(`world:${spaceKey}:playerStates`, userId, JSON.stringify(state));
		redisPipeline.hexpire(`world:${spaceKey}:playerStates`, 30, 'FIELDS', 1, userId);
		await redisPipeline.exec();
	}

	@bindThis
	public async getPlayerStates(spaceKey: string): Promise<Record<string, PlayerState>> {
		const entries = await this.redisClient.hgetall(`world:${spaceKey}:playerStates`);
		return Object.fromEntries(Object.entries(entries).map(([userId, state]) => [userId, JSON.parse(state) as PlayerState]));
	}

	@bindThis
	public getPlayerStatesAndHeatbeat(userId: MiUser['id'], spaceKey: string): Promise<Record<string, PlayerState>> {
		// TODO: atomicにやる
		this.heartbeat(userId, spaceKey);
		return this.getPlayerStates(spaceKey);
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
	public async getPlayerProfiles(spaceKey: string, userId?: MiUser['id']): Promise<Record<string, any>> {
		let playerIds = await this.redisClient.hkeys(`world:${spaceKey}:players`);
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
