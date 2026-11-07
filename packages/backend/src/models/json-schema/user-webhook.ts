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
			format: 'id',
			optional: false, nullable: false,
		},
		userId: {
			type: 'string',
			format: 'id',
			optional: false, nullable: false,
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		on: {
			type: 'array',
			items: {
				type: 'string',
				optional: false, nullable: false,
				enum: webhookEventTypes,
			},
		},
		url: {
			type: 'string',
			optional: false, nullable: false,
		},
		secret: {
			type: 'string',
			optional: false, nullable: false,
		},
		active: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		latestSentAt: {
			type: 'string',
			format: 'date-time',
			optional: false, nullable: true,
		},
		latestStatus: {
			type: 'integer',
			optional: false, nullable: true,
		},
	},
} as const;
