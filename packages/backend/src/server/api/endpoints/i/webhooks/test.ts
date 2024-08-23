/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import ms from 'ms';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { webhookEventTypes } from '@/models/Webhook.js';
import { WebhookTestService } from '@/core/WebhookTestService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['webhooks'],

	requireCredential: true,
	kind: 'read:account',

	limit: {
		duration: ms('15min'),
		max: 60,
	},

	errors: {
		noSuchActiveWebhook: {
			message: 'No such active webhook.',
			code: 'NO_SUCH_ACTIVE_WEBHOOK',
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
			enum: webhookEventTypes,
		},
	},
	required: ['webhookId', 'type'],
} as const;

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private webhookTestService: WebhookTestService,
	) {
		super(meta, paramDef, async (ps, me) => {
			try {
				await this.webhookTestService.testUserWebhook({ webhookId: ps.webhookId, type: ps.type }, me);
			} catch (e) {
				if (e instanceof WebhookTestService.NoSuchActiveWebhookError) {
					throw new ApiError(meta.errors.noSuchActiveWebhook);
				}
				throw e;
			}
		});
	}
}
