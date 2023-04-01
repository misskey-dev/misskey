import { notificationTypes } from '@/types.js';

export const packedNotificationSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		isRead: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		type: {
			type: 'string',
			optional: false, nullable: false,
			enum: [...notificationTypes],
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
		choice: {
			type: 'number',
			optional: true, nullable: true,
		},
		invitation: {
			type: 'object',
			optional: true, nullable: true,
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
	},
} as const;
