/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable, OnApplicationShutdown } from '@nestjs/common';
import * as Redis from 'ioredis';
import type { InstancesRepository, MiMeta } from '@/models/_.js';
import type { MiInstance } from '@/models/Instance.js';
import { MemoryKVCache } from '@/misc/cache.js';
import { IdService } from '@/core/IdService.js';
import { DI } from '@/di-symbols.js';
import { UtilityService } from '@/core/UtilityService.js';
import { bindThis } from '@/decorators.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import { Serialized } from '@/types.js';
import { diffArrays } from '@/misc/diff-arrays.js';

@Injectable()
export class FederatedInstanceService implements OnApplicationShutdown {
	private readonly federatedInstanceCache: MemoryKVCache<MiInstance | null>;

	constructor(
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,

		@Inject(DI.instancesRepository)
		private instancesRepository: InstancesRepository,

		private utilityService: UtilityService,
		private idService: IdService,
	) {
		this.federatedInstanceCache = new MemoryKVCache(1000 * 60 * 3); // 3m
		this.redisForSub.on('message', this.onMessage);
	}

	@bindThis
	public async fetchOrRegister(host: string): Promise<MiInstance> {
		host = this.utilityService.toPuny(host);

		const cached = this.federatedInstanceCache.get(host);
		if (cached) return cached;

		let index = await this.instancesRepository.findOneBy({ host });
		if (index == null) {
			await this.instancesRepository.createQueryBuilder('instance')
				.insert()
				.values({
					id: this.idService.gen(),
					host,
					firstRetrievedAt: new Date(),
					isBlocked: this.utilityService.isBlockedHost(host),
					isSilenced: this.utilityService.isSilencedHost(host),
					isMediaSilenced: this.utilityService.isMediaSilencedHost(host),
					isAllowListed: this.utilityService.isAllowListedHost(host),
				})
				.orIgnore()
				.execute();

			index = await this.instancesRepository.findOneByOrFail({ host });
		}

		this.federatedInstanceCache.set(host, index);
		return index;
	}

	@bindThis
	public async fetch(host: string): Promise<MiInstance | null> {
		host = this.utilityService.toPuny(host);

		const cached = this.federatedInstanceCache.get(host);
		if (cached !== undefined) return cached;

		const index = await this.instancesRepository.findOneBy({ host });

		if (index == null) {
			this.federatedInstanceCache.set(host, null);
			return null;
		} else {
			this.federatedInstanceCache.set(host, index);
			return index;
		}
	}

	@bindThis
	public async update(id: MiInstance['id'], data: Partial<MiInstance>): Promise<void> {
		const result = await this.instancesRepository.createQueryBuilder().update()
			.set(data)
			.where('id = :id', { id })
			.returning('*')
			.execute()
			.then((response) => {
				return response.raw[0];
			});

		this.federatedInstanceCache.set(result.host, result);
	}

	private syncCache(before: Serialized<MiMeta | undefined>, after: Serialized<MiMeta>): void {
		const changed =
			hasDiff(before?.blockedHosts, after.blockedHosts) ||
			hasDiff(before?.silencedHosts, after.silencedHosts) ||
			hasDiff(before?.mediaSilencedHosts, after.mediaSilencedHosts) ||
			hasDiff(before?.federationHosts, after.federationHosts) ||
			hasDiff(before?.bubbleInstances, after.bubbleInstances);

		if (changed) {
			// We have to clear the whole thing, otherwise subdomains won't be synced.
			this.federatedInstanceCache.clear();
		}
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message as GlobalEvents['internal']['payload'];
			if (type === 'metaUpdated') {
				this.syncCache(body.before, body.after);
			}
		}
	}

	@bindThis
	public dispose(): void {
		this.redisForSub.off('message', this.onMessage);
		this.federatedInstanceCache.dispose();
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}

function hasDiff(before: string[] | null | undefined, after: string[] | null | undefined): boolean {
	const { added, removed } = diffArrays(before, after);
	return added.length > 0 || removed.length > 0;
}

