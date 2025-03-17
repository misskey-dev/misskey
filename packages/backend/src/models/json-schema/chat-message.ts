/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedChatMessageSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
		},
		createdAt: {
			type: 'string',
			format: 'date-time',
			optional: false, nullable: false,
		},
		fromUserId: {
			type: 'string',
			optional: false, nullable: false,
		},
		fromUser: {
			type: 'object',
			optional: true, nullable: false,
			ref: 'UserLite',
		},
		toUserId: {
			type: 'string',
			optional: true, nullable: true,
		},
		toUser: {
			type: 'object',
			optional: true, nullable: true,
			ref: 'UserLite',
		},
		text: {
			type: 'string',
			optional: true, nullable: true,
		},
		fileId: {
			type: 'string',
			optional: true, nullable: true,
		},
		file: {
			type: 'object',
			optional: true, nullable: true,
			ref: 'DriveFile',
		},
	},
} as const;

export const packedChatMessageLiteSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
		},
		createdAt: {
			type: 'string',
			format: 'date-time',
			optional: false, nullable: false,
		},
		fromUserId: {
			type: 'string',
			optional: false, nullable: false,
		},
		toUserId: {
			type: 'string',
			optional: true, nullable: true,
		},
		text: {
			type: 'string',
			optional: true, nullable: true,
		},
		fileId: {
			type: 'string',
			optional: true, nullable: true,
		},
		file: {
			type: 'object',
			optional: true, nullable: true,
			ref: 'DriveFile',
		},
	},
} as const;
