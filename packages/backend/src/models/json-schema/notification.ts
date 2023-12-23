/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { notificationTypes } from '@/types.js';

export const packedNotificationSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		createdAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		type: {
			type: 'string',
			optional: false, nullable: false,
			enum: [...notificationTypes, 'reaction:grouped', 'renote:grouped'],
		},
		user: {
			type: 'object',
			ref: 'UserLite',
			optional: true, nullable: true,
		},
		userId: {
			type: 'string',
			optional: true, nullable: true,
			format: 'id',
		},
		note: {
			type: 'object',
			ref: 'Note',
			optional: true, nullable: true,
		},
		reaction: {
			type: 'string',
			optional: true, nullable: true,
		},
		achievement: {
			type: 'string',
			optional: true, nullable: false,
		},
		body: {
			type: 'string',
			optional: true, nullable: true,
		},
		header: {
			type: 'string',
			optional: true, nullable: true,
		},
		icon: {
			type: 'string',
			optional: true, nullable: true,
		},
		reactions: {
			type: 'array',
			optional: true, nullable: true,
			items: {
				type: 'object',
				properties: {
					user: {
						type: 'object',
						ref: 'UserLite',
						optional: false, nullable: false,
					},
					reaction: {
						type: 'string',
						optional: false, nullable: false,
					},
				},
				required: ['user', 'reaction'],
			},
		},
		users: {
			type: 'array',
			optional: true, nullable: true,
			items: {
				type: 'object',
				ref: 'UserLite',
				optional: false, nullable: false,
			},
		},
	},
} as const;
