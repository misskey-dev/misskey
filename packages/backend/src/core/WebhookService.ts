/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { In } from 'typeorm';
import type { SystemWebhooksRepository, WebhooksRepository } from '@/models/_.js';
import type { MiWebhook } from '@/models/Webhook.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { GlobalEventService, GlobalEvents } from '@/core/GlobalEventService.js';
import { MiSystemWebhook, type SystemWebhookEventType } from '@/models/SystemWebhook.js';
import { isNotNull } from '@/misc/is-not-null.js';
import { IdService } from '@/core/IdService.js';
import { QueueService } from '@/core/QueueService.js';
import type { OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class WebhookService implements OnApplicationShutdown {
	private activeWebhooksFetched = false;
	private activeWebhooks: MiWebhook[] = [];
	private activeSystemWebhooksFetched = false;
	private activeSystemWebhooks: MiSystemWebhook[] = [];

	constructor(
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,
		@Inject(DI.webhooksRepository)
		private webhooksRepository: WebhooksRepository,
		@Inject(DI.systemWebhooksRepository)
		private systemWebhooksRepository: SystemWebhooksRepository,
		private idService: IdService,
		private queueService: QueueService,
		private globalEventService: GlobalEventService,
	) {
		//this.onMessage = this.onMessage.bind(this);
		this.redisForSub.on('message', this.onMessage);
	}

	@bindThis
	public async getActiveWebhooks() {
		if (!this.activeWebhooksFetched) {
			this.activeWebhooks = await this.webhooksRepository.findBy({
				active: true,
			});
			this.activeWebhooksFetched = true;
		}

		return this.activeWebhooks;
	}

	@bindThis
	public async fetchActiveSystemWebhooks() {
		if (!this.activeSystemWebhooksFetched) {
			this.activeSystemWebhooks = await this.systemWebhooksRepository.findBy({
				isActive: true,
			});
			this.activeSystemWebhooksFetched = true;
		}

		return this.activeSystemWebhooks;
	}

	/**
	 * SystemWebhook の一覧を取得する.
	 */
	@bindThis
	public async fetchSystemWebhooks(params?: {
		ids?: MiSystemWebhook['id'][];
		isActive?: MiSystemWebhook['isActive'];
		on?: MiSystemWebhook['on'];
	}): Promise<MiSystemWebhook[]> {
		const query = this.systemWebhooksRepository.createQueryBuilder('systemWebhook');
		if (params) {
			if (params.ids && params.ids.length > 0) {
				query.andWhere('systemWebhook.id IN (:...ids)', { ids: params.ids });
			}
			if (params.isActive !== undefined) {
				query.andWhere('systemWebhook.isActive = :isActive', { isActive: params.isActive });
			}
			if (params.on && params.on.length > 0) {
				query.andWhere('systemWebhook.on IN (:...on)', { on: params.on });
			}
		}

		return query.getMany();
	}

	/**
	 * SystemWebhook を作成する.
	 */
	@bindThis
	public async createSystemWebhooks(params: {
		isActive: MiSystemWebhook['isActive'];
		name: MiSystemWebhook['name'];
		on: MiSystemWebhook['on'];
		url: MiSystemWebhook['url'];
		secret: MiSystemWebhook['secret'];
	}[]): Promise<MiSystemWebhook[]> {
		const entities = params.map(param => {
			return {
				id: this.idService.gen(),
				isActive: param.isActive,
				name: param.name,
				on: param.on,
				url: param.url,
				secret: param.secret,
			};
		});

		await this.systemWebhooksRepository.insert(entities);

		const webhook = await this.systemWebhooksRepository.findBy({ id: In(entities.map(it => it.id)) });
		for (const w of webhook) {
			this.globalEventService.publishInternalEvent('systemWebhookCreated', w);
		}

		return webhook;
	}

	/**
	 * SystemWebhook を更新する.
	 */
	@bindThis
	public async updateSystemWebhooks(params: {
		id: MiSystemWebhook['id'];
		isActive: MiSystemWebhook['isActive'];
		name: MiSystemWebhook['name'];
		on: MiSystemWebhook['on'];
		url: MiSystemWebhook['url'];
		secret: MiSystemWebhook['secret'];
	}[]): Promise<MiSystemWebhook[]> {
		const entitiesMap = await this.systemWebhooksRepository
			.findBy({ id: In(params.map(it => it.id)) })
			.then(it => new Map(it.map(it => [it.id, it])));

		// パラメータとentityのペアを作成（パラメータに対応するentityが存在しない場合はフィルタしておく）
		const paramEntityPairs = params
			.map(param => {
				const entity = entitiesMap.get(param.id);
				return entity ? { entity, param } : null;
			})
			.filter(isNotNull);

		await Promise.all(
			paramEntityPairs.map(({ entity, param }) => {
				return this.systemWebhooksRepository.update(entity.id, {
					updatedAt: new Date(),
					isActive: param.isActive,
					name: param.name,
					on: param.on,
					url: param.url,
					secret: param.secret,
				});
			}),
		);

		const webhook = await this.systemWebhooksRepository.findBy({ id: In(paramEntityPairs.map(it => it.entity.id)) });
		for (const w of webhook) {
			this.globalEventService.publishInternalEvent('systemWebhookUpdated', w);
		}

		return webhook;
	}

	/**
	 * SystemWebhook を削除する.
	 */
	@bindThis
	public async deleteSystemWebhooks(ids: MiSystemWebhook['id'][]) {
		const webhook = await this.systemWebhooksRepository.findBy({ id: In(ids) });
		await this.systemWebhooksRepository.delete(ids);

		for (const w of webhook) {
			this.globalEventService.publishInternalEvent('systemWebhookDeleted', w);
		}
	}

	/**
	 * SystemWebhook をWebhook配送キューに追加する
	 * @see QueueService.systemWebhookDeliver
	 */
	@bindThis
	public enqueueSystemWebhook(webhook: MiSystemWebhook, type: SystemWebhookEventType, content: unknown) {
		return this.queueService.systemWebhookDeliver(webhook, type, content);
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);
		if (obj.channel !== 'internal') {
			return;
		}

		const { type, body } = obj.message as GlobalEvents['internal']['payload'];
		switch (type) {
			case 'webhookCreated': {
				if (body.active) {
					this.activeWebhooks.push({ // TODO: このあたりのデシリアライズ処理は各modelファイル内に関数としてexportしたい
						...body,
						latestSentAt: body.latestSentAt ? new Date(body.latestSentAt) : null,
						user: null, // joinなカラムは通常取ってこないので
					});
				}
				break;
			}
			case 'webhookUpdated': {
				if (body.active) {
					const i = this.activeWebhooks.findIndex(a => a.id === body.id);
					if (i > -1) {
						this.activeWebhooks[i] = { // TODO: このあたりのデシリアライズ処理は各modelファイル内に関数としてexportしたい
							...body,
							latestSentAt: body.latestSentAt ? new Date(body.latestSentAt) : null,
							user: null, // joinなカラムは通常取ってこないので
						};
					} else {
						this.activeWebhooks.push({ // TODO: このあたりのデシリアライズ処理は各modelファイル内に関数としてexportしたい
							...body,
							latestSentAt: body.latestSentAt ? new Date(body.latestSentAt) : null,
							user: null, // joinなカラムは通常取ってこないので
						});
					}
				} else {
					this.activeWebhooks = this.activeWebhooks.filter(a => a.id !== body.id);
				}
				break;
			}
			case 'webhookDeleted': {
				this.activeWebhooks = this.activeWebhooks.filter(a => a.id !== body.id);
				break;
			}
			case 'systemWebhookCreated': {
				if (body.isActive) {
					this.activeSystemWebhooks.push(MiSystemWebhook.deserialize(body));
				}
				break;
			}
			case 'systemWebhookUpdated': {
				if (body.isActive) {
					const i = this.activeSystemWebhooks.findIndex(a => a.id === body.id);
					if (i > -1) {
						this.activeSystemWebhooks[i] = MiSystemWebhook.deserialize(body);
					} else {
						this.activeSystemWebhooks.push(MiSystemWebhook.deserialize(body));
					}
				} else {
					this.activeSystemWebhooks = this.activeSystemWebhooks.filter(a => a.id !== body.id);
				}
				break;
			}
			case 'systemWebhookDeleted': {
				this.activeSystemWebhooks = this.activeSystemWebhooks.filter(a => a.id !== body.id);
				break;
			}
			default:
				break;
		}
	}

	@bindThis
	public dispose(): void {
		this.redisForSub.off('message', this.onMessage);
	}

	@bindThis
	public onApplicationShutdown(signal?: string | undefined): void {
		this.dispose();
	}
}
