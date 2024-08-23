/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { webhookEventTypes } from '@/models/Webhook.js';

export const packedUserWebhookSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			format: 'misskey:id',
		},
		userId: {
			type: 'string',
			format: 'misskey:id',
		},
		name: { type: 'string' },
		on: {
			type: 'array',
			items: {
				type: 'string',
				enum: webhookEventTypes,
			},
		},
		url: { type: 'string' },
		secret: { type: 'string' },
		active: { type: 'boolean' },
		latestSentAt: { type: 'string', format: 'date-time', nullable: true },
		latestStatus: { type: 'integer', nullable: true },
	},
} as const;
