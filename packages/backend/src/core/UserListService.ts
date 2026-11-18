/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnApplicationShutdown, OnModuleInit } from '@nestjs/common';
import * as Redis from 'ioredis';
import { ModuleRef } from '@nestjs/core';
import { In } from 'typeorm';
import type { UserListMembershipsRepository } from '@/models/_.js';
import type { MiUser } from '@/models/User.js';
import type { MiUserList } from '@/models/UserList.js';
import type { MiUserListMembership } from '@/models/UserListMembership.js';
import { IdService } from '@/core/IdService.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { QueueService } from '@/core/QueueService.js';
import { RedisKVCache } from '@/misc/cache.js';
import { RoleService } from '@/core/RoleService.js';
import { SystemAccountService } from '@/core/SystemAccountService.js';

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
		private queueService: QueueService,
		private systemAccountService: SystemAccountService,
	) {
		this.membersCache = new RedisKVCache<Set<string>>(this.redisClient, 'userListMembers', {
			lifetime: 1000 * 60 * 30, // 30m
			memoryCacheLifetime: 1000 * 60, // 1m
			fetcher: (key) => this.userListMembershipsRepository.find({
				where: { userListId: key },
				select: { userId: true },
			}).then(xs => new Set(xs.map(x => x.userId))),
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
				case 'userListMemberAdded':
				case 'userListMemberRemoved': {
					await this.membersCache.delete(body.userListId);
					break;
				}
				default:
					break;
			}
		}
	}

	@bindThis
	public async addMember(target: MiUser, list: MiUserList, me: MiUser, options: { withReplies?: boolean } = {}) {
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
			withReplies: options.withReplies ?? false,
		} as MiUserListMembership);

		this.globalEventService.publishInternalEvent('userListMemberAdded', { userListId: list.id, memberId: target.id });
		this.globalEventService.publishUserListStream(list.id, 'internalMembershipUpdated', { userId: target.id });
		this.globalEventService.publishUserListStream(list.id, 'userAdded', await this.userEntityService.pack(target));

		// このインスタンス内にこのリモートユーザーをフォローしているユーザーがいなくても投稿を受け取るためにダミーのユーザーがフォローしたということにする
		if (this.userEntityService.isRemoteUser(target)) {
			const proxy = await this.systemAccountService.fetch('proxy');
			this.queueService.createFollowJob([{ from: { id: proxy.id }, to: { id: target.id } }]);
		}
	}

	@bindThis
	public async removeMember(target: MiUser, list: MiUserList) {
		await this.userListMembershipsRepository.delete({
			userId: target.id,
			userListId: list.id,
		});

		this.globalEventService.publishInternalEvent('userListMemberRemoved', { userListId: list.id, memberId: target.id });
		this.globalEventService.publishUserListStream(list.id, 'internalMembershipUpdated', { userId: target.id });
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

		this.globalEventService.publishUserListStream(list.id, 'internalMembershipUpdated', { userId: target.id });
	}

	@bindThis
	public async removeMemberFromAllLists(listOwner: { id: MiUser['id'] }, target: MiUser, options: { notifyClients?: boolean } = {}) {
		const removed = await this.userListMembershipsRepository.createQueryBuilder()
			.delete()
			.where({
				userId: target.id,
				userListUserId: listOwner.id,
			})
			.returning(['userListId'])
			.execute()
			.then(result => result.raw as Pick<MiUserListMembership, 'userListId'>[]);

		if (removed.length === 0) return;

		for (const { userListId } of removed) {
			this.globalEventService.publishInternalEvent('userListMemberRemoved', { userListId, memberId: target.id });
			this.globalEventService.publishUserListStream(userListId, 'internalMembershipUpdated', { userId: target.id });
		}

		if (!(options.notifyClients ?? true)) return;

		const packedTarget = await this.userEntityService.pack(target);
		for (const { userListId } of removed) {
			this.globalEventService.publishUserListStream(userListId, 'userRemoved', packedTarget);
		}
	}

	/**
	 * src が入っているリストに dst を追加する (アカウント移行用)
	 * - src はリストから外さない
	 * - リストのメンバー数の上限は確認しない
	 */
	@bindThis
	public async copyMemberships(src: { id: MiUser['id'] }, dst: MiUser) {
		// Return if there is no list to be updated.
		const oldMemberships = await this.userListMembershipsRepository.find({
			where: {
				userId: src.id,
			},
			select: { userListId: true, userListUserId: true },
		});
		if (oldMemberships.length === 0) return;

		const existingUserListIds = await this.userListMembershipsRepository.find({
			where: {
				userId: dst.id,
				userListId: In(oldMemberships.map(membership => membership.userListId)),
			},
			select: { userListId: true },
		}).then(memberships => new Set(memberships.map(membership => membership.userListId)));

		const newMemberships: Map<string, { userId: string; userListId: string; userListUserId: string; }> = new Map();

		// 重複しないようにIDを生成
		const genId = (): string => {
			let id: string;
			do {
				id = this.idService.gen();
			} while (newMemberships.has(id));
			return id;
		};
		for (const membership of oldMemberships) {
			if (existingUserListIds.has(membership.userListId)) continue; // skip if dst exists in this user's list
			newMemberships.set(genId(), {
				userId: dst.id,
				userListId: membership.userListId,
				userListUserId: membership.userListUserId,
			});
		}

		const arrayToInsert = Array.from(newMemberships.entries()).map(entry => ({ ...entry[1], id: entry[0] }));
		if (arrayToInsert.length > 0) {
			await this.userListMembershipsRepository.insert(arrayToInsert);

			for (const { userListId } of arrayToInsert) {
				this.globalEventService.publishInternalEvent('userListMemberAdded', { userListId, memberId: dst.id });
				this.globalEventService.publishUserListStream(userListId, 'internalMembershipUpdated', { userId: dst.id });
			}
		}

		// クライアントへの通知とプロキシのフォローは、一方が失敗しても他方を行う
		const results = await Promise.allSettled([
			(async () => {
				if (arrayToInsert.length === 0) return;
				const packedDst = await this.userEntityService.pack(dst);
				for (const { userListId } of arrayToInsert) {
					this.globalEventService.publishUserListStream(userListId, 'userAdded', packedDst);
				}
			})(),
			(async () => {
				// Have the proxy account follow the new account in the same way as addMember
				if (!this.userEntityService.isRemoteUser(dst)) return;
				const proxy = await this.systemAccountService.fetch('proxy');
				await this.queueService.createFollowJob([{ from: { id: proxy.id }, to: { id: dst.id } }]);
			})(),
		]);
		for (const result of results) {
			if (result.status === 'rejected') throw result.reason;
		}
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
