/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import * as Redis from 'ioredis';
import { ModuleRef } from '@nestjs/core';
import type { UserListMembershipsRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import type { MiUserList } from '@/models/UserList.js';
import type { MiUserListMembership } from '@/models/UserListMembership.js';
import { IdService } from '@/core/IdService.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { ProxyAccountService } from '@/core/ProxyAccountService.js';
import { bindThis } from '@/decorators.js';
import { QueueService } from '@/core/QueueService.js';
import { RedisKVCache } from '@/misc/cache.js';
import { RoleService } from '@/core/RoleService.js';

@Injectable()
export class UserListService implements OnApplicationShutdown, OnModuleInit {
	public static TooManyUsersError = class extends Error {};

	public membersCache: RedisKVCache<Set<string>>;
	private roleService: RoleService;

	constructor(
		private moduleRef: ModuleRef,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,

		@Inject(DI.userListMembershipsRepository)
		private userListMembershipsRepository: UserListMembershipsRepository,

		private userEntityService: UserEntityService,
		private idService: IdService,
		private globalEventService: GlobalEventService,
		private proxyAccountService: ProxyAccountService,
		private queueService: QueueService,
	) {
		this.membersCache = new RedisKVCache<Set<string>>(this.redisClient, 'userListMembers', {
			lifetime: 1000 * 60 * 30, // 30m
			memoryCacheLifetime: 1000 * 60, // 1m
			fetcher: (key) => this.userListMembershipsRepository.find({ where: { userListId: key }, select: ['userId'] }).then(xs => new Set(xs.map(x => x.userId))),
			toRedisConverter: (value) => JSON.stringify(Array.from(value)),
			fromRedisConverter: (value) => new Set(JSON.parse(value)),
		});

		this.redisForSub.on('message', this.onMessage);
	}

	async onModuleInit() {
		this.roleService = this.moduleRef.get(RoleService.name);
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message as GlobalEvents['internal']['payload'];
			switch (type) {
				case 'userListMemberAdded': {
					const { userListId, memberId } = body;
					const members = await this.membersCache.get(userListId);
					if (members) {
						members.add(memberId);
					}
					break;
				}
				case 'userListMemberRemoved': {
					const { userListId, memberId } = body;
					const members = await this.membersCache.get(userListId);
					if (members) {
						members.delete(memberId);
					}
					break;
				}
				default:
					break;
			}
		}
	}

	@bindThis
	public async addMember(target: MiUser, list: MiUserList, me: MiUser) {
		const currentCount = await this.userListMembershipsRepository.countBy({
			userListId: list.id,
		});
		if (currentCount >= (await this.roleService.getUserPolicies(me.id)).userEachUserListsLimit) {
			throw new UserListService.TooManyUsersError();
		}

		await this.userListMembershipsRepository.insert({
			id: this.idService.gen(),
			userId: target.id,
			userListId: list.id,
			userListUserId: list.userId,
		} as MiUserListMembership);

		this.globalEventService.publishInternalEvent('userListMemberAdded', { userListId: list.id, memberId: target.id });
		this.globalEventService.publishUserListStream(list.id, 'userAdded', await this.userEntityService.pack(target));

		// このインスタンス内にこのリモートユーザーをフォローしているユーザーがいなくても投稿を受け取るためにダミーのユーザーがフォローしたということにする
		if (this.userEntityService.isRemoteUser(target)) {
			const proxy = await this.proxyAccountService.fetch();
			if (proxy) {
				this.queueService.createFollowJob([{ from: { id: proxy.id }, to: { id: target.id } }]);
			}
		}
	}

	@bindThis
	public async removeMember(target: MiUser, list: MiUserList) {
		await this.userListMembershipsRepository.delete({
			userId: target.id,
			userListId: list.id,
		});

		this.globalEventService.publishInternalEvent('userListMemberRemoved', { userListId: list.id, memberId: target.id });
		this.globalEventService.publishUserListStream(list.id, 'userRemoved', await this.userEntityService.pack(target));
	}

	@bindThis
	public async updateMembership(target: MiUser, list: MiUserList, options: { withReplies?: boolean }) {
		const membership = await this.userListMembershipsRepository.findOneBy({
			userId: target.id,
			userListId: list.id,
		});

		if (membership == null) {
			throw new Error('User is not a member of the list');
		}

		await this.userListMembershipsRepository.update({
			id: membership.id,
		}, {
			withReplies: options.withReplies,
		});
	}

	@bindThis
	public dispose(): void {
		this.redisForSub.off('message', this.onMessage);
		this.membersCache.dispose();
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
