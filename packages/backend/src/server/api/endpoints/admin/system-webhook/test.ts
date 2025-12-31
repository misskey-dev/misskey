/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { WebhookTestService } from '@/core/WebhookTestService.js';
import { ApiError } from '@/server/api/error.js';
import { systemWebhookEventTypes } from '@/models/SystemWebhook.js';

export const meta = {
	tags: ['webhooks'],

	requireCredential: true,
	requireModerator: true,
	secure: true,
	kind: 'read:admin:system-webhook',

	limit: {
		duration: ms('15min'),
		max: 60,
	},

	errors: {
		noSuchWebhook: {
			message: 'No such webhook.',
			code: 'NO_SUCH_WEBHOOK',
			id: '0c52149c-e913-18f8-5dc7-74870bfe0cf9',
		},
	},
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		webhookId: {
			type: 'string',
			format: 'misskey:id',
		},
		type: {
			type: 'string',
			enum: systemWebhookEventTypes,
		},
		override: {
			type: 'object',
			properties: {
				url: { type: 'string', nullable: false },
				secret: { type: 'string', nullable: false },
			},
		},
	},
	required: ['webhookId', 'type'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private webhookTestService: WebhookTestService,
	) {
		super(meta, paramDef, async (ps) => {
			try {
				await this.webhookTestService.testSystemWebhook({
					webhookId: ps.webhookId,
					type: ps.type,
					override: ps.override,
				});
			} catch (e) {
				if (e instanceof WebhookTestService.NoSuchWebhookError) {
					throw new ApiError(meta.errors.noSuchWebhook);
				}
				throw e;
			}
		});
	}
}
