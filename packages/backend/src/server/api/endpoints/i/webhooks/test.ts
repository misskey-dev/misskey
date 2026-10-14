/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { Injectable } from '@nestjs/common';
import ms from 'ms';
import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { Endpoint } from '@/server/api/endpoint-base.js';
import { webhookEventTypes } from '@/models/Webhook.js';
import { WebhookTestService } from '@/core/WebhookTestService.js';
import { ApiError } from '@/server/api/error.js';

export const meta = {
	tags: ['webhooks'],

	requireCredential: true,
	secure: true,
	kind: 'read:account',

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

export const paramDef = v.object({
	webhookId: mi.misskeyId(),
	type: v.picklist([...webhookEventTypes]),
	override: v.optional(v.object({
		url: v.optional(v.string()),
		secret: v.optional(v.string()),
	})),
});

@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> { // eslint-disable-line import/no-default-export
	constructor(
		private webhookTestService: WebhookTestService,
	) {
		super(meta, paramDef, async (ps, me) => {
			try {
				await this.webhookTestService.testUserWebhook({
					webhookId: ps.webhookId,
					type: ps.type,
					override: ps.override,
				}, me);
			} catch (e) {
				if (e instanceof WebhookTestService.NoSuchWebhookError) {
					throw new ApiError(meta.errors.noSuchWebhook);
				}
				throw e;
			}
		});
	}
}
