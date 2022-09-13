import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { IdService } from '@/services/IdService.js';
import { Webhooks } from '@/models/index.js';
import { publishInternalEvent } from '@/services/stream.js';
import { webhookEventTypes } from '@/models/entities/webhook.js';

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

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		private idService: IdService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const webhook = await Webhooks.insert({
				id: this.idService.genId(),
				createdAt: new Date(),
				userId: me.id,
				name: ps.name,
				url: ps.url,
				secret: ps.secret,
				on: ps.on,
			}).then(x => Webhooks.findOneByOrFail(x.identifiers[0]));

			publishInternalEvent('webhookCreated', webhook);

			return webhook;
		});
	}
}
