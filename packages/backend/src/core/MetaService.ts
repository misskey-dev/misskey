/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DI } from '@/di-symbols.js';
import { MiMeta } from '@/models/Meta.js';
import { GlobalEventPublishService } from '@/core/GlobalEventPublishService.js';
import { bindThis } from '@/decorators.js';
import { GlobalEventSubscribeService } from '@/core/GlobalEventSubscribeService.js';
import type { GlobalEvents } from '@/core/GlobalEventPublishService.js';
import { FeaturedService } from '@/core/FeaturedService.js';
import type { OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class MetaService implements OnApplicationShutdown {
	private cache: MiMeta | undefined;
	private intervalId: NodeJS.Timeout;

	constructor(
		@Inject(DI.db)
		private db: DataSource,

		private featuredService: FeaturedService,
		private globalEventPublishService: GlobalEventPublishService,
		private globalEventSubscribeService: GlobalEventSubscribeService,
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

		this.globalEventSubscribeService.onInternalEvent(this.onMessage);
	}

	@bindThis
	private async onMessage(payload: GlobalEvents['internal']['payload']): Promise<void> {
		const { type, body } = payload;
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

	@bindThis
	public async fetch(noCache = false): Promise<MiMeta> {
		if (!noCache && this.cache) return this.cache;

		return await this.db.transaction(async transactionalEntityManager => {
			// 過去のバグでレコードが複数出来てしまっている可能性があるので新しいIDを優先する
			const metas = await transactionalEntityManager.find(MiMeta, {
				order: {
					id: 'DESC',
				},
			});

			const meta = metas[0];

			if (meta) {
				this.cache = meta;
				return meta;
			} else {
				// metaが空のときfetchMetaが同時に呼ばれるとここが同時に呼ばれてしまうことがあるのでフェイルセーフなupsertを使う
				const saved = await transactionalEntityManager
					.upsert(
						MiMeta,
						{
							id: 'x',
						},
						['id'],
					)
					.then((x) => transactionalEntityManager.findOneByOrFail(MiMeta, x.identifiers[0]));

				this.cache = saved;
				return saved;
			}
		});
	}

	@bindThis
	public async update(data: Partial<MiMeta>): Promise<MiMeta> {
		let before: MiMeta | undefined;

		const updated = await this.db.transaction(async transactionalEntityManager => {
			const metas = await transactionalEntityManager.find(MiMeta, {
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

		this.globalEventPublishService.publishInternalEvent('metaUpdated', { before, after: updated });

		return updated;
	}

	@bindThis
	public dispose(): void {
		clearInterval(this.intervalId);
		this.globalEventSubscribeService.offInternalEvent(this.onMessage);
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
