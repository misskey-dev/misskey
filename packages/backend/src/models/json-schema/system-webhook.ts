/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { systemWebhookEventTypes } from '@/models/SystemWebhook.js';

export const packedSystemWebhookSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
		},
		isActive: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		updatedAt: {
			type: 'string',
			format: 'date-time',
			optional: false, nullable: false,
		},
		latestSentAt: {
			type: 'string',
			format: 'date-time',
			optional: false, nullable: true,
		},
		latestStatus: {
			type: 'number',
			optional: false, nullable: true,
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
				enum: systemWebhookEventTypes,
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
	},
} as const;
