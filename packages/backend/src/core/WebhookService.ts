import { Inject, Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import type { WebhooksRepository } from '@/models/index.js';
import type { Webhook } from '@/models/entities/Webhook.js';
import { DI } from '@/di-symbols.js';
import type { OnApplicationShutdown } from '@nestjs/common';

@Injectable()
export class WebhookService implements OnApplicationShutdown {
	private webhooksFetched = false;
	private webhooks: Webhook[] = [];

	constructor(
		@Inject(DI.redisSubscriber)
		private redisSubscriber: Redis.Redis,

		@Inject(DI.webhooksRepository)
		private webhooksRepository: WebhooksRepository,
	) {
		this.onMessage = this.onMessage.bind(this);
		this.redisSubscriber.on('message', this.onMessage);
	}

	public async getActiveWebhooks() {
		if (!this.webhooksFetched) {
			this.webhooks = await this.webhooksRepository.findBy({
				active: true,
			});
			this.webhooksFetched = true;
		}
	
		return this.webhooks;
	}

	private async onMessage(_: string, data: string): Promise<void> {
		const obj = JSON.parse(data);

		if (obj.channel === 'internal') {
			const { type, body } = obj.message;
			switch (type) {
				case 'webhookCreated':
					if (body.active) {
						this.webhooks.push(body);
					}
					break;
				case 'webhookUpdated':
					if (body.active) {
						const i = this.webhooks.findIndex(a => a.id === body.id);
						if (i > -1) {
							this.webhooks[i] = body;
						} else {
							this.webhooks.push(body);
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

	public onApplicationShutdown(signal?: string | undefined) {
		this.redisSubscriber.off('message', this.onMessage);
	}
}
