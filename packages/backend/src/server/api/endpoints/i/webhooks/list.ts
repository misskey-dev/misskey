/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Inject, Injectable } from '@nestjs/common';
import * as v from 'valibot';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { webhookEventTypes } from '@/models/Webhook.js';
import type { WebhooksRepository } from '@/models/_.js';
import { DI } from '@/di-symbols.js';
import { packedUserWebhookSchema } from '@/models/schema/user-webhook.js';

// TODO: UserWebhook schemaの適用
export const meta = {
	tags: ['webhooks', 'account'],

	requireCredential: true,

	kind: 'read:account',

	res: v.array(packedUserWebhookSchema),
} as const;

export const paramDef = v.object({});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		@Inject(DI.webhooksRepository)
		private webhooksRepository: WebhooksRepository,
	) {
		super(meta, paramDef, async (ps, me) => {
			const webhooks = await this.webhooksRepository.findBy({
				userId: me.id,
			});

			return webhooks.map(webhook => ({
				id: webhook.id,
				userId: webhook.userId,
				name: webhook.name,
				on: webhook.on,
				url: webhook.url,
				secret: webhook.secret,
				active: webhook.active,
				latestSentAt: webhook.latestSentAt ? webhook.latestSentAt.toISOString() : null,
				latestStatus: webhook.latestStatus,
			}));
		});
	}
}
