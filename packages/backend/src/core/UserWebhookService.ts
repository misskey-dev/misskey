/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import { type WebhooksRepository } from '@/models/_.js';
import { MiWebhook, WebhookEventTypes } from '@/models/Webhook.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { GlobalEvents } from '@/core/GlobalEventService.js';
import Logger from '@/logger.js';
import { LoggerService } from '@/core/LoggerService.js';
import { QueueService } from '@/core/QueueService.js';
import type { OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class UserWebhookService implements OnApplicationShutdown {
	private logger: Logger;
	private activeWebhooksFetched = false;
	private activeWebhooks: MiWebhook[] = [];

	constructor(
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,
		@Inject(DI.webhooksRepository)
		private webhooksRepository: WebhooksRepository,
		private loggerService: LoggerService,
		private queueService: QueueService,
	) {
		this.redisForSub.on('message', this.onMessage);
		this.logger = this.loggerService.getLogger('webhook');
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

	/**
	 * UserWebhook をWebhook配送キューに追加する
	 * @see QueueService.systemWebhookDeliver
	 * // TODO: contentの型を厳格化する
	 */
	@bindThis
	public async enqueueUserWebhook<T extends WebhookEventTypes>(
		webhook: MiWebhook | MiWebhook['id'],
		type: T,
		content: unknown,
		opts?: {
			attempts?: number;
		},
	) {
		const webhookEntity = typeof webhook === 'string'
			? (await this.getActiveWebhooks()).find(a => a.id === webhook)
			: webhook;
		if (!webhookEntity || !webhookEntity.active) {
			this.logger.debug(`UserWebhook is not active or not found : ${webhook}`);
			return;
		}

		if (!webhookEntity.on.includes(type)) {
			this.logger.debug(`UserWebhook ${webhookEntity.id} is not listening to ${type}`);
			return;
		}

		return this.queueService.userWebhookDeliver(webhookEntity, type, content, opts);
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
