/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import * as Redis from 'ioredis';
import { DI } from '@/di-symbols.js';
import { MiMeta } from '@/models/Meta.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { bindThis } from '@/decorators.js';
import type { GlobalEvents } from '@/core/GlobalEventService.js';
import { FeaturedService } from '@/core/FeaturedService.js';
import { MiInstance } from '@/models/Instance.js';
import { diffArrays } from '@/misc/diff-arrays.js';
import type { MetasRepository } from '@/models/_.js';
import type { OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class MetaService implements OnApplicationShutdown {
	private cache: MiMeta | undefined;
	private intervalId: NodeJS.Timeout;

	constructor(
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,

		@Inject(DI.db)
		private db: DataSource,

		@Inject(DI.metasRepository)
		private readonly metasRepository: MetasRepository,

		private featuredService: FeaturedService,
		private globalEventService: GlobalEventService,
	) {
		//this.onMessage = this.onMessage.bind(this);

		if (process.env.NODE_ENV !== 'test') {
			this.intervalId = setInterval(() => {
				this.fetch(true).then(meta => {
					// fetch内でもセットしてるけど仕様変更の可能性もあるため一応
					this.cache = meta;
				});
			}, 1000 * 60 * 5);
		}

		this.redisForSub.on('message', this.onMessage);
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message as GlobalEvents['internal']['payload'];
			switch (type) {
				case 'metaUpdated': {
					this.cache = { // TODO: このあたりのデシリアライズ処理は各modelファイル内に関数としてexportしたい
						...(body.after),
						rootUser: null, // joinなカラムは通常取ってこないので
					};
					break;
				}
				default:
					break;
			}
		}
	}

	@bindThis
	public async fetch(noCache = false): Promise<MiMeta> {
		if (!noCache && this.cache) return this.cache;

		// 過去のバグでレコードが複数出来てしまっている可能性があるので新しいIDを優先する
		let meta = await this.metasRepository.createQueryBuilder('meta')
			.select()
			.orderBy({
				id: 'DESC',
			})
			.limit(1)
			.getOne();

		if (!meta) {
			await this.metasRepository.createQueryBuilder('meta')
				.insert()
				.values({
					id: 'x',
				})
				.orIgnore()
				.execute();

			meta = await this.metasRepository.createQueryBuilder('meta')
				.select()
				.orderBy({
					id: 'DESC',
				})
				.limit(1)
				.getOneOrFail();
		}

		this.cache = meta;
		return meta;
	}

	@bindThis
	public async update(data: Partial<MiMeta>): Promise<MiMeta> {
		let before: MiMeta | undefined;

		const updated = await this.db.transaction(async transactionalEntityManager => {
			const metas: (MiMeta | undefined)[] = await transactionalEntityManager.find(MiMeta, {
				order: {
					id: 'DESC',
				},
			});

			before = metas[0];

			if (before) {
				await transactionalEntityManager.update(MiMeta, before.id, data);
			} else {
				await transactionalEntityManager.save(MiMeta, {
					...data,
					id: 'x',
				});
			}

			const afters = await transactionalEntityManager.find(MiMeta, {
				order: {
					id: 'DESC',
				},
			});

			// Propagate changes to blockedHosts, silencedHosts, mediaSilencedHosts, federationInstances, and bubbleInstances to the relevant instance rows
			// Do this inside the transaction to avoid potential race condition (when an instance gets registered while we're updating).
			await this.persistBlocks(transactionalEntityManager, before ?? {}, afters[0]);

			return afters[0];
		});

		if (data.hiddenTags) {
			process.nextTick(() => {
				const hiddenTags = new Set<string>(data.hiddenTags);
				if (before) {
					for (const previousHiddenTag of before.hiddenTags) {
						hiddenTags.delete(previousHiddenTag);
					}
				}

				for (const hiddenTag of hiddenTags) {
					this.featuredService.removeHashtagsFromRanking(hiddenTag);
				}
			});
		}

		this.globalEventService.publishInternalEvent('metaUpdated', { before, after: updated });

		return updated;
	}

	@bindThis
	public dispose(): void {
		clearInterval(this.intervalId);
		this.redisForSub.off('message', this.onMessage);
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}

	private async persistBlocks(tem: EntityManager, before: Partial<MiMeta>, after: Partial<MiMeta>): Promise<void> {
		await this.persistBlock(tem, before.blockedHosts, after.blockedHosts, 'isBlocked');
		await this.persistBlock(tem, before.silencedHosts, after.silencedHosts, 'isSilenced');
		await this.persistBlock(tem, before.mediaSilencedHosts, after.mediaSilencedHosts, 'isMediaSilenced');
		await this.persistBlock(tem, before.federationHosts, after.federationHosts, 'isAllowListed');
		await this.persistBlock(tem, before.bubbleInstances, after.bubbleInstances, 'isBubbled');
	}

	private async persistBlock(tem: EntityManager, before: string[] | undefined, after: string[] | undefined, field: keyof MiInstance): Promise<void> {
		const { added, removed } = diffArrays(before, after);

		if (removed.length > 0) {
			await this.updateInstancesByHost(tem, field, false, removed);
		}

		if (added.length > 0) {
			await this.updateInstancesByHost(tem, field, true, added);
		}
	}

	private async updateInstancesByHost(tem: EntityManager, field: keyof MiInstance, value: boolean, hosts: string[]): Promise<void> {
		// Use non-array queries when possible, as they are indexed and can be much faster.
		if (hosts.length === 1) {
			const pattern = genHostPattern(hosts[0]);
			await tem
				.createQueryBuilder(MiInstance, 'instance')
				.update()
				.set({ [field]: value })
				.where('(lower(reverse("host")) || \'.\') LIKE :pattern', { pattern })
				.execute();
		} else if (hosts.length > 1) {
			const patterns = hosts.map(host => genHostPattern(host));
			await tem
				.createQueryBuilder(MiInstance, 'instance')
				.update()
				.set({ [field]: value })
				.where('(lower(reverse("host")) || \'.\') LIKE ANY (:patterns)', { patterns })
				.execute();
		}
	}
}

function genHostPattern(host: string): string {
	return host.toLowerCase().split('').reverse().join('') + '.%';
}
