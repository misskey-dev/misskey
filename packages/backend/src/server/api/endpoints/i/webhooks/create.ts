/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { IdService } from '@/core/IdService.js';
import type { WebhooksRepository } from '@/models/_.js';
import { webhookEventTypes } from '@/models/Webhook.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['webhooks'],

	requireCredential: true,

	kind: 'write:account',

	errors: {
		tooManyWebhooks: {
			message: 'You cannot create webhook any more.',
			code: 'TOO_MANY_WEBHOOKS',
			id: '87a9bb19-111e-4e37-81d3-a3e7426453b0',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		name: { type: 'string', minLength: 1, maxLength: 100 },
		url: { type: 'string', minLength: 1, maxLength: 1024 },
		secret: { type: 'string', maxLength: 1024, default: '' },
		on: { type: 'array', items: {
			type: 'string', enum: webhookEventTypes,
		} },
	},
	required: ['name', 'url', 'on'],
} as const;

// TODO: ロジックをサービスに切り出す

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.webhooksRepository)
		private webhooksRepository: WebhooksRepository,

		private idService: IdService,
		private globalEventService: GlobalEventService,
		private roleService: RoleService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const currentWebhooksCount = await this.webhooksRepository.countBy({
				userId: me.id,
			});
			if (currentWebhooksCount > (await this.roleService.getUserPolicies(me.id)).webhookLimit) {
				throw new ApiError(meta.errors.tooManyWebhooks);
			}

			const webhook = await this.webhooksRepository.insert({
				id: this.idService.gen(),
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
