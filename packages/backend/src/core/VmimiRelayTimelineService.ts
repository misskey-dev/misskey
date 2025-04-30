/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Brackets, SelectQueryBuilder } from 'typeorm';
import { bindThis } from '@/decorators.js';
import { HttpRequestService } from '@/core/HttpRequestService.js';
import { LoggerService } from '@/core/LoggerService.js';
import type Logger from '@/logger.js';
import { DI } from '@/di-symbols.js';
import * as Redis from 'ioredis';

type VmimiInstanceList = { Url: string; }[];

// one day
const UpdateInterval = 1000 * 60 * 60 * 24; // 24 hours = 1 day
const MinRetryInterval = 1000 * 60; // one minutes
const MaxRetryInterval = 1000 * 60 * 60 * 6; // 6 hours

const redisKey = 'vmimiRelayTimelineServerListCacheV1';

@Injectable()
export class VmimiRelayTimelineService {
	instanceHosts: Set<string>;
	instanceHostsArray: string[];
	nextUpdate: number;
	nextRetryInterval: number;
	updatePromise: Promise<void> | null;
	private logger: Logger;

	constructor(
		@Inject(DI.redis)
		private redisClient: Redis.Redis,

		private httpRequestService: HttpRequestService,
		private loggerService: LoggerService,
	) {
		// Initialize with
		this.instanceHosts = new Set<string>([]);
		this.instanceHostsArray = [];
		this.nextUpdate = 0;
		this.nextRetryInterval = MinRetryInterval;
		this.updatePromise = null;

		this.logger = this.loggerService.getLogger('vmimi');

		this.checkForUpdateInstanceList();
	}

	@bindThis
	checkForUpdateInstanceList() {
		if (this.updatePromise == null && this.nextUpdate < Date.now()) {
			this.updatePromise = this.updateInstanceList().finally(() => this.updatePromise = null);
		}
	}

	@bindThis
	async updateInstanceList() {
		try {
			this.logger.info('Updating instance list');
			const instanceList = await this.httpRequestService.getJson<VmimiInstanceList>('https://relay.virtualkemomimi.net/api/servers');
			this.instanceHostsArray = instanceList.map(i => new URL(i.Url).host);
			this.instanceHosts = new Set<string>(this.instanceHostsArray);
			this.nextUpdate = Date.now() + UpdateInterval;
			this.logger.info(`Got instance list: ${this.instanceHostsArray}`);
			this.nextRetryInterval = MinRetryInterval;

			// Update the cache
			await this.redisClient.set(redisKey, this.instanceHostsArray.join(','));
		} catch (e) {
			this.logger.error('Failed to update instance list', e as any);
			this.nextUpdate = Date.now() + this.nextRetryInterval;
			setTimeout(() => this.checkForUpdateInstanceList(), this.nextRetryInterval + 5);
			this.nextRetryInterval = Math.min(this.nextRetryInterval * 2, MaxRetryInterval);

			// when failed, we try to get the cache
			try {
				const cache = await this.redisClient.get(redisKey);
				if (cache != null && cache.length !== 0) {
					this.instanceHostsArray = cache.split(',');
					this.instanceHosts = new Set<string>(this.instanceHostsArray);
					this.logger.info(`Got instance list from cache (we still try to get from origin later): ${this.instanceHostsArray}`);
				}
			} catch {
				// ignored
			}
		}
	}

	@bindThis
	isRelayedInstance(host: string | null): boolean {
		this.checkForUpdateInstanceList();
		// assuming the current instance is joined to the i relay
		if (host == null) return true;
		return this.instanceHosts.has(host);
	}

	get hostNames (): string[] {
		this.checkForUpdateInstanceList();
		return this.instanceHostsArray;
	}
}
