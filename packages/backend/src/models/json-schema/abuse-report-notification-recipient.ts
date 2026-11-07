/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedAbuseReportNotificationRecipientSchema = {
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
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		method: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['email', 'webhook'],
		},
		userId: {
			type: 'string',
			optional: true, nullable: false,
		},
		user: {
			type: 'object',
			optional: true, nullable: false,
			ref: 'UserLite',
		},
		systemWebhookId: {
			type: 'string',
			optional: true, nullable: false,
		},
		systemWebhook: {
			type: 'object',
			optional: true, nullable: false,
			ref: 'SystemWebhook',
		},
	},
} as const;
