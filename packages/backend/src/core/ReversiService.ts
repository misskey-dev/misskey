/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { In } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import type {
	MiReversiGame,
	MiRole,
	MiRoleAssignment,
	ReversiGamesRepository,
	ReversiMatchingsRepository,
	RoleAssignmentsRepository,
	RolesRepository,
	UsersRepository,
} from '@/models/_.js';
import { MemoryKVCache, MemorySingleCache } from '@/misc/cache.js';
import type { MiUser } from '@/models/User.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { MetaService } from '@/core/MetaService.js';
import { CacheService } from '@/core/CacheService.js';
import type { RoleCondFormulaValue } from '@/models/Role.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { IdService } from '@/core/IdService.js';
import { ModerationLogService } from '@/core/ModerationLogService.js';
import type { Packed } from '@/misc/json-schema.js';
import { FanoutTimelineService } from '@/core/FanoutTimelineService.js';
import { NotificationService } from '@/core/NotificationService.js';
import { ReversiMatchingEntityService } from '@/core/entities/ReversiMatchingEntityService.js';
import type { OnApplicationShutdown, OnModuleInit } from '@nestjs/common';

@Injectable()
export class ReversiService implements OnApplicationShutdown, OnModuleInit {
	private notificationService: NotificationService;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.redisForTimelines)
		private redisForTimelines: Redis.Redis,

		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,

		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.reversiGamesRepository)
		private reversiGamesRepository: ReversiGamesRepository,

		@Inject(DI.reversiMatchingsRepository)
		private reversiMatchingsRepository: ReversiMatchingsRepository,

		private metaService: MetaService,
		private cacheService: CacheService,
		private userEntityService: UserEntityService,
		private globalEventService: GlobalEventService,
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
				map: eighteight.data,
				bw: 'random',
				isLlotheo: false,
			}).then(x => this.reversiGamesRepository.findOneByOrFail(x.identifiers[0]));

			publishReversiStream(exist.parentId, 'matched', await ReversiGames.pack(game, { id: exist.parentId }));

			const other = await this.reversiMatchingsRepository.countBy({
				childId: me.id,
			});

			if (other == 0) {
				publishMainStream(me.id, 'reversiNoInvites');
			}

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
			publishReversiStream(child.id, 'invited', packed);
			publishMainStream(child.id, 'reversiInvited', packed);

			return null;
		}
	}

	@bindThis
	public dispose(): void {
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
