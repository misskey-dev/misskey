/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable, Inject } from '@nestjs/common';
import { DataSource } from 'typeorm';
import * as Redis from 'ioredis';
import type { FollowingsRepository, InstancesRepository, MiMeta } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { acquireChartInsertLock } from '@/misc/distributed-lock.js';
import { UtilityService } from '@/core/UtilityService.js';
import Chart from '../core.js';
import { ChartLoggerService } from '../ChartLoggerService.js';
import { name, schema } from './entities/federation.js';
import type { KVs } from '../core.js';

/**
 * フェデレーションに関するチャート
 */
@Injectable()
export default class FederationChart extends Chart<typeof schema> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.meta)
		private meta: MiMeta,

		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private utilityService: UtilityService,
		private chartLoggerService: ChartLoggerService,
	) {
		super(db, (k) => acquireChartInsertLock(redisClient, k), chartLoggerService.logger, name, schema);
	}

	protected async tickMajor(): Promise<Partial<KVs<typeof schema>>> {
		return {
		};
	}

	protected async tickMinor(): Promise<Partial<KVs<typeof schema>>> {
		// following はサーバー全体で非常に大きくなりうるため、まずフォロー先・フォロワーのホストの一覧 (高々リモートサーバーの数) を取り出し、
		// ブロック・停止の判定はその一覧に対して行う。
		const [subHosts, pubHosts, suspendedHosts, activeHosts] = await Promise.all([
			this.followingsRepository.createQueryBuilder('following')
				.select('following.followeeHost', 'host')
				.distinct(true)
				.where('following.followeeHost IS NOT NULL')
				.getRawMany<{ host: string; }>()
				.then(rows => new Set(rows.map(row => row.host))),
			this.followingsRepository.createQueryBuilder('following')
				.select('following.followerHost', 'host')
				.distinct(true)
				.where('following.followerHost IS NOT NULL')
				.getRawMany<{ host: string; }>()
				.then(rows => new Set(rows.map(row => row.host))),
			this.instancesRepository.createQueryBuilder('instance')
				.select('instance.host', 'host')
				.where('instance.suspensionState != \'none\'')
				.getRawMany<{ host: string; }>()
				.then(rows => new Set(rows.map(row => row.host))),
			this.instancesRepository.createQueryBuilder('instance')
				.select('instance.host', 'host')
				.where('instance.suspensionState = \'none\'')
				.andWhere('instance.isNotResponding = false')
				.getRawMany<{ host: string; }>()
				.then(rows => rows.map(row => row.host)),
		]);

		const isBlocked = (host: string) => this.utilityService.isBlockedHost(this.meta.blockedHosts, host);
		const isCounted = (host: string) => !isBlocked(host) && !suspendedHosts.has(host);

		const countedSubHosts = [...subHosts].filter(isCounted);

		return {
			'sub': countedSubHosts.length,
			'pub': [...pubHosts].filter(isCounted).length,
			'pubsub': countedSubHosts.filter(host => pubHosts.has(host)).length,
			'subActive': activeHosts.filter(host => subHosts.has(host) && !isBlocked(host)).length,
			'pubActive': activeHosts.filter(host => pubHosts.has(host) && !isBlocked(host)).length,
		};
	}

	@bindThis
	public async deliverd(host: string, succeeded: boolean): Promise<void> {
		await this.commit(succeeded ? {
			'deliveredInstances': [host],
		} : {
			'stalled': [host],
		});
	}

	@bindThis
	public async inbox(host: string): Promise<void> {
		await this.commit({
			'inboxInstances': [host],
		});
	}
}
