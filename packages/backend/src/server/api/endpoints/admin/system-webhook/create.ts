/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { SystemWebhookEntityService } from '@/core/entities/SystemWebhookEntityService.js';
import { WebhookService } from '@/core/WebhookService.js';
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
		items: {
			type: 'array',
			items: {
				type: 'object',
				properties: {
					isActive: {
						type: 'boolean',
					},
					name: {
						type: 'string',
						minLength: 1,
						maxLength: 255,
					},
					on: {
						type: 'array',
						items: {
							type: 'string',
							enum: systemWebhookEventTypes,
						},
					},
					url: {
						type: 'string',
						minLength: 1,
						maxLength: 1024,
					},
					secret: {
						type: 'string',
						minLength: 1,
						maxLength: 1024,
					},
				},
				required: [
					'isActive',
					'name',
					'on',
					'url',
					'secret',
				],
			},
		},
	},
	required: ['items'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private webhookService: WebhookService,
		private systemWebhookEntityService: SystemWebhookEntityService,
	) {
		super(meta, paramDef, async (ps) => {
			const result = await this.webhookService.createSystemWebhooks(
				ps.items.map(it => ({
					isActive: it.isActive,
					name: it.name,
					on: it.on,
					url: it.url,
					secret: it.secret,
				})),
			);

			return this.systemWebhookEntityService.packMany(result);
		});
	}
}
