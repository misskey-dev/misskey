/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as Redis from 'ioredis';
import type { WebhooksRepository } from '@/models/index.js';
import type { Webhook } from '@/models/entities/Webhook.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';
import { StreamMessages } from '@/server/api/stream/types.js';
import type { OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class WebhookService implements OnApplicationShutdown {
	private webhooksFetched = false;
	private webhooks: Webhook[] = [];

	constructor(
		@Inject(DI.redisForSub)
		private redisForSub: Redis.Redis,

		@Inject(DI.webhooksRepository)
		private webhooksRepository: WebhooksRepository,
	) {
		//this.onMessage = this.onMessage.bind(this);
		this.redisForSub.on('message', this.onMessage);
	}

	@bindThis
	public async getActiveWebhooks() {
		if (!this.webhooksFetched) {
			this.webhooks = await this.webhooksRepository.findBy({
				active: true,
			});
			this.webhooksFetched = true;
		}

		return this.webhooks;
	}

	@bindThis
	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message as StreamMessages['internal']['payload'];
			switch (type) {
				case 'webhookCreated':
					if (body.active) {
						this.webhooks.push({
							...body,
							createdAt: new Date(body.createdAt),
							latestSentAt: body.latestSentAt ? new Date(body.latestSentAt) : null,
						});
					}
					break;
				case 'webhookUpdated':
					if (body.active) {
						const i = this.webhooks.findIndex(a => a.id === body.id);
						if (i > -1) {
							this.webhooks[i] = {
								...body,
								createdAt: new Date(body.createdAt),
								latestSentAt: body.latestSentAt ? new Date(body.latestSentAt) : null,
							};
						} else {
							this.webhooks.push({
								...body,
								createdAt: new Date(body.createdAt),
								latestSentAt: body.latestSentAt ? new Date(body.latestSentAt) : null,
							});
						}
					} else {
						this.webhooks = this.webhooks.filter(a => a.id !== body.id);
					}
					break;
				case 'webhookDeleted':
					this.webhooks = this.webhooks.filter(a => a.id !== body.id);
					break;
				default:
					break;
			}
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
