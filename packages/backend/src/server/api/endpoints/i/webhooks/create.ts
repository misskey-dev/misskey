import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { IdService } from '@/core/IdService.js';
import type { WebhooksRepository } from '@/models/index.js';
import { webhookEventTypes } from '@/models/entities/Webhook.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';

export const meta = {
	tags: ['webhooks'],

	requireCredential: true,

	kind: 'write:account',
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 100 },
		url: { type: 'string', minLength: 1, maxLength: 1024 },
		secret: { type: 'string', minLength: 1, maxLength: 1024 },
		on: { type: 'array', items: {
			type: 'string', enum: webhookEventTypes,
		} },
	},
	required: ['name', 'url', 'secret', 'on'],
} as const;

// TODO: ロジックをサービスに切り出す

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.webhooksRepository)
		private webhooksRepository: WebhooksRepository,

		private idService: IdService,
		private globalEventService: GlobalEventService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const webhook = await this.webhooksRepository.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				userId: me.id,
				name: ps.name,
				url: ps.url,
				secret: ps.secret,
				on: ps.on,
			}).then(x => this.webhooksRepository.findOneByOrFail(x.identifiers[0]));

			this.globalEventService.publishInternalEvent('webhookCreated', webhook);

			return webhook;
		});
	}
}
