/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { IdService } from '@/core/IdService.js';
import type { WebhooksRepository } from '@/models/_.js';
import { webhookEventTypes } from '@/models/Webhook.js';
import { GlobalEventService } from '@/core/GlobalEventService.js';
import { DI } from '@/di-symbols.js';
import { RoleService } from '@/core/RoleService.js';
import { ApiError } from '@/server/api/error.js';

// TODO: UserWebhook schemaの適用
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

	res: v.object({
		id: v.pipe(v.string(), mi.format('misskey:id')),
		userId: v.pipe(v.string(), mi.format('misskey:id')),
		name: v.string(),
		on: v.array(v.picklist([...webhookEventTypes])),
		url: v.string(),
		secret: v.string(),
		active: v.boolean(),
		latestSentAt: v.nullable(mi.dateTimeString()),
		latestStatus: v.nullable(mi.integer()),
	}),
} as const;

export const paramDef = v.object({
	name: v.pipe(v.string(), mi.minCodePoints(1), mi.maxCodePoints(100)),
	url: v.pipe(v.string(), mi.minCodePoints(1), mi.maxCodePoints(1024)),
	secret: v.optional(v.pipe(v.string(), mi.maxCodePoints(1024)), ''),
	on: v.array(v.picklist([...webhookEventTypes])),
});

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
			if (currentWebhooksCount >= (await this.roleService.getUserPolicies(me.id)).webhookLimit) {
				throw new ApiError(meta.errors.tooManyWebhooks);
			}

			const webhook = await this.webhooksRepository.insertOne({
				id: this.idService.gen(),
				userId: me.id,
				name: ps.name,
				url: ps.url,
				secret: ps.secret,
				on: ps.on,
			});

			this.globalEventService.publishInternalEvent('webhookCreated', webhook);

			return {
				id: webhook.id,
				userId: webhook.userId,
				name: webhook.name,
				on: webhook.on,
				url: webhook.url,
				secret: webhook.secret,
				active: webhook.active,
				latestSentAt: webhook.latestSentAt ? webhook.latestSentAt.toISOString() : null,
				latestStatus: webhook.latestStatus,
			};
		});
	}
}
