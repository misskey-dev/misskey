/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { DataSource } from 'typeorm';
import { DI } from '@/di-symbols.js';
import type { MiUser } from '@/models/User.js';
import { normalizeForSearch } from '@/misc/normalize-for-search.js';
import { IdService } from '@/core/IdService.js';
import { MiHashtag } from '@/models/Hashtag.js';
import type { HashtagsRepository, MiMeta } from '@/models/_.js';
import { UserEntityService } from '@/core/entities/UserEntityService.js';
import { bindThis } from '@/decorators.js';
import { FeaturedService } from '@/core/FeaturedService.js';
import { UtilityService } from '@/core/UtilityService.js';
import Logger from '../logger.js';

const logger = new Logger('hashtag/create');

type AttachedOrMentioned = 'attached' | 'mentioned';
type UpdatingHashtagColumn = {
	totalUserIds: keyof MiHashtag & `${AttachedOrMentioned}UserIds`,
	totalUsersCount: keyof MiHashtag & `${AttachedOrMentioned}UsersCount`,
	localUserIds: keyof MiHashtag & `${AttachedOrMentioned}LocalUserIds`,
	localUsersCount: keyof MiHashtag & `${AttachedOrMentioned}LocalUsersCount`,
	remoteUserIds: keyof MiHashtag & `${AttachedOrMentioned}RemoteUserIds`,
	remoteUsersCount: keyof MiHashtag & `${AttachedOrMentioned}RemoteUsersCount`,
};

@Injectable()
export class HashtagService {
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.redis)
		private redisClient: Redis.Redis, // TODO: 専用のRedisサーバーを設定できるようにする

		@Inject(DI.hashtagsRepository)
		private hashtagsRepository: HashtagsRepository,

		private userEntityService: UserEntityService,
		private featuredService: FeaturedService,
		private idService: IdService,
		private utilityService: UtilityService,
	) {
	}

	@bindThis
	public async updateHashtags(user: { id: MiUser['id']; host: MiUser['host']; }, tags: string[]) {
		for (const tag of tags) {
			await this.updateHashtag(user, tag);
		}
	}

	@bindThis
	public async updateUsertags(user: MiUser, tags: string[]) {
		for (const tag of tags) {
			await this.updateHashtag(user, tag, true, true);
		}

		for (const tag of user.tags.filter(x => !tags.includes(x))) {
			await this.updateHashtag(user, tag, true, false);
		}
	}

	@bindThis
	public async updateHashtag(user: { id: MiUser['id']; host: MiUser['host']; }, tag: string, isUserAttached = false, inc = true) {
		tag = normalizeForSearch(tag);

		// TODO: サンプリング
		this.updateHashtagsRanking(tag, user.id);

		const column: UpdatingHashtagColumn = isUserAttached ? {
			totalUserIds: 'attachedUserIds',
			totalUsersCount: 'attachedUsersCount',
			localUserIds: 'attachedLocalUserIds',
			localUsersCount: 'attachedLocalUsersCount',
			remoteUserIds: 'attachedRemoteUserIds',
			remoteUsersCount: 'attachedRemoteUsersCount',
		} : {
			totalUserIds: 'mentionedUserIds',
			totalUsersCount: 'mentionedUsersCount',
			localUserIds: 'mentionedLocalUserIds',
			localUsersCount: 'mentionedLocalUsersCount',
			remoteUserIds: 'mentionedRemoteUserIds',
			remoteUsersCount: 'mentionedRemoteUsersCount',
		};

		if (inc) {
			await this.#incrementHashTag(user, tag, column);
		} else {
			await this.#decrementHashTag(user, tag, column);
		}
	}

	async #incrementHashTag(
		user: { id: MiUser['id']; host: MiUser['host']; },
		tag: string,
		columns: UpdatingHashtagColumn,
	) {
		const isLocal = this.userEntityService.isLocalUser(user);
		const { totalUserIds, totalUsersCount } = columns;
		const localOrRemoteUserIds = isLocal ? columns.localUserIds : columns.remoteUserIds;
		const localOrRemoteUserCount = isLocal ? columns.localUsersCount : columns.remoteUsersCount;

		const runner = this.db.createQueryRunner('master');
		try {
			await runner.query(
				`INSERT into "hashtag"("id", "name", "${totalUserIds}", "${totalUsersCount}", "${localOrRemoteUserIds}",
				                       "${localOrRemoteUserCount}")
				 VALUES ($3, $1, ARRAY [$2], 1, ARRAY [$2], 1)
				 ON CONFLICT ("name")
					 DO UPDATE SET "${totalUserIds}"           = ${appendUserIdIfNotExists(totalUserIds)},
					               "${totalUsersCount}"        = ${incrementCountIfNotExists(totalUserIds, totalUsersCount)},
					               "${localOrRemoteUserIds}"   = ${appendUserIdIfNotExists(localOrRemoteUserIds)},
					               "${localOrRemoteUserCount}" = ${incrementCountIfNotExists(localOrRemoteUserIds, localOrRemoteUserCount)}`,
				[tag, user.id, this.idService.gen()],
			);
		} finally {
			await runner.release();
		}

		function appendUserIdIfNotExists(userIds: keyof MiHashtag & `${string}UserIds`): string {
			return `CASE WHEN NOT ("hashtag"."${userIds}" @> ARRAY[$2 ::varchar]) THEN array_append("hashtag"."${userIds}", $2) ELSE "hashtag"."${userIds}" END`;
		}

		function incrementCountIfNotExists(userIds: keyof MiHashtag & `${string}UserIds`, userCount: keyof MiHashtag & `${string}UsersCount`): string {
			return `CASE WHEN NOT ("hashtag"."${userIds}" @> ARRAY[$2 ::varchar]) THEN "hashtag"."${userCount}" + 1 ELSE "hashtag"."${userCount}" END`;
		}
	}

	async #decrementHashTag(
		user: { id: MiUser['id']; host: MiUser['host']; },
		tag: string,
		columns: UpdatingHashtagColumn,
	) {
		const isLocal = this.userEntityService.isLocalUser(user);
		const { totalUserIds, totalUsersCount } = columns;
		const localOrRemoteUserIds = isLocal ? columns.localUserIds : columns.remoteUserIds;
		const localOrRemoteUserCount = isLocal ? columns.localUsersCount : columns.remoteUsersCount;

		const runner = this.db.createQueryRunner('master');
		try {
			await runner.query(
				`UPDATE "hashtag"
				 SET "${totalUserIds}"           = array_remove("${totalUserIds}", $2),
				     "${totalUsersCount}"        = ${decrementIfExists(totalUserIds, totalUsersCount)},
				     "${localOrRemoteUserIds}"   = array_remove("${localOrRemoteUserIds}", $2),
				     "${localOrRemoteUserCount}" = ${decrementIfExists(localOrRemoteUserIds, localOrRemoteUserCount)}
				 WHERE "name" = $1`,
				[tag, user.id],
			);
		} finally {
			await runner.release();
		}

		function decrementIfExists(userIds: keyof MiHashtag & `${string}UserIds`, userCount: keyof MiHashtag & `${string}UsersCount`): string {
			return `CASE WHEN ("${userIds}" @> ARRAY[$2]) THEN "${userCount}" - 1 ELSE "${userCount}" END`;
		}
	}

	@bindThis
	public async updateHashtagsRanking(hashtag: string, userId: MiUser['id']): Promise<void> {
		const hiddenTags = this.meta.hiddenTags.map(t => normalizeForSearch(t));
		if (hiddenTags.includes(hashtag)) return;
		if (this.utilityService.isKeyWordIncluded(hashtag, this.meta.sensitiveWords)) return;

		// YYYYMMDDHHmm (10分間隔)
		const now = new Date();
		now.setMinutes(Math.floor(now.getMinutes() / 10) * 10, 0, 0);
		const window = `${now.getUTCFullYear()}${(now.getUTCMonth() + 1).toString().padStart(2, '0')}${now.getUTCDate().toString().padStart(2, '0')}${now.getUTCHours().toString().padStart(2, '0')}${now.getUTCMinutes().toString().padStart(2, '0')}`;

		const exist = await this.redisClient.sismember(`hashtagUsers:${hashtag}`, userId);
		if (exist === 1) return;

		this.featuredService.updateHashtagsRanking(hashtag, 1);

		const redisPipeline = this.redisClient.pipeline();

		// チャート用
		redisPipeline.pfadd(`hashtagUsers:${hashtag}:${window}`, userId);
		redisPipeline.expire(`hashtagUsers:${hashtag}:${window}`,
			60 * 60 * 24 * 3, // 3日間
			'NX', // "NX -- Set expiry only when the key has no expiry" = 有効期限がないときだけ設定
		);

		// ユニークカウント用
		// TODO: Bloom Filter を使うようにしても良さそう
		redisPipeline.sadd(`hashtagUsers:${hashtag}`, userId);
		redisPipeline.expire(`hashtagUsers:${hashtag}`,
			60 * 60, // 1時間
			'NX', // "NX -- Set expiry only when the key has no expiry" = 有効期限がないときだけ設定
		);

		redisPipeline.exec();
	}

	@bindThis
	public async getChart(hashtag: string, range: number): Promise<number[]> {
		const now = new Date();
		now.setMinutes(Math.floor(now.getMinutes() / 10) * 10, 0, 0);

		const redisPipeline = this.redisClient.pipeline();

		for (let i = 0; i < range; i++) {
			const window = `${now.getUTCFullYear()}${(now.getUTCMonth() + 1).toString().padStart(2, '0')}${now.getUTCDate().toString().padStart(2, '0')}${now.getUTCHours().toString().padStart(2, '0')}${now.getUTCMinutes().toString().padStart(2, '0')}`;
			redisPipeline.pfcount(`hashtagUsers:${hashtag}:${window}`);
			now.setMinutes(now.getMinutes() - (i * 10), 0, 0);
		}

		const result = await redisPipeline.exec();

		if (result == null) return [];

		return result.map(x => x[1]) as number[];
	}

	@bindThis
	public async getCharts(hashtags: string[], range: number): Promise<Record<string, number[]>> {
		const now = new Date();
		now.setMinutes(Math.floor(now.getMinutes() / 10) * 10, 0, 0);

		const redisPipeline = this.redisClient.pipeline();

		for (let i = 0; i < range; i++) {
			const window = `${now.getUTCFullYear()}${(now.getUTCMonth() + 1).toString().padStart(2, '0')}${now.getUTCDate().toString().padStart(2, '0')}${now.getUTCHours().toString().padStart(2, '0')}${now.getUTCMinutes().toString().padStart(2, '0')}`;
			for (const hashtag of hashtags) {
				redisPipeline.pfcount(`hashtagUsers:${hashtag}:${window}`);
			}
			now.setMinutes(now.getMinutes() - (i * 10), 0, 0);
		}

		const result = await redisPipeline.exec();

		if (result == null) return {};

		// key is hashtag
		const charts = {} as Record<string, number[]>;
		for (const hashtag of hashtags) {
			charts[hashtag] = [];
		}

		for (let i = 0; i < range; i++) {
			for (let j = 0; j < hashtags.length; j++) {
				charts[hashtags[j]].push(result[(i * hashtags.length) + j][1] as number);
			}
		}

		return charts;
	}
}
