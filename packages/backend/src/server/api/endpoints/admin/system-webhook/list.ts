/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { WebhookService } from '@/core/WebhookService.js';
import { SystemWebhookEntityService } from '@/core/entities/SystemWebhookEntityService.js';
import { systemWebhookEventTypes } from '@/models/SystemWebhook.js';

export const meta = {
	tags: ['admin', 'system-webhook'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:system-webhook',

	res: {
		type: 'array',
		items: {
			type: 'object',
			ref: 'SystemWebhook',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		isActive: {
			type: 'boolean',
		},
		on: {
			type: 'array',
			items: {
				type: 'string',
				enum: systemWebhookEventTypes,
			},
		},
	},
	required: [],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private webhookService: WebhookService,
		private systemWebhookEntityService: SystemWebhookEntityService,
	) {
		super(meta, paramDef, async (ps) => {
			const webhooks = await this.webhookService.fetchSystemWebhooks({
				isActive: ps.isActive,
				on: ps.on,
			});
			return this.systemWebhookEntityService.packMany(webhooks);
		});
	}
}
