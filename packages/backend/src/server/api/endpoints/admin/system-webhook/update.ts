/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { SystemWebhookEntityService } from '@/core/entities/SystemWebhookEntityService.js';
import { systemWebhookEventTypes } from '@/models/SystemWebhook.js';
import { SystemWebhookService } from '@/core/SystemWebhookService.js';

export const meta = {
	tags: ['admin', 'system-webhook'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'write:admin:system-webhook',

	res: {
		type: 'object',
		ref: 'SystemWebhook',
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			format: 'misskey:id',
		},
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
		'id',
		'isActive',
		'name',
		'on',
		'url',
		'secret',
	],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private systemWebhookService: SystemWebhookService,
		private systemWebhookEntityService: SystemWebhookEntityService,
	) {
		super(meta, paramDef, async (ps, me) => {
			const result = await this.systemWebhookService.updateSystemWebhook(
				{
					id: ps.id,
					isActive: ps.isActive,
					name: ps.name,
					on: ps.on,
					url: ps.url,
					secret: ps.secret,
				},
				me,
			);

			return this.systemWebhookEntityService.pack(result);
		});
	}
}
