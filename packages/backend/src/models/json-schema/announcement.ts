/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedAnnouncementSchema = {
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
		updatedAt: {
			type: 'string',
			optional: false, nullable: true,
			format: 'date-time',
		},
		text: {
			type: 'string',
			optional: false, nullable: false,
		},
		title: {
			type: 'string',
			optional: false, nullable: false,
		},
		imageUrl: {
			type: 'string',
			optional: false, nullable: true,
		},
		icon: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['info', 'warning', 'error', 'success'],
		},
		display: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['dialog', 'normal', 'banner'],
		},
		needConfirmationToRead: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		silence: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		forYou: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isRead: {
			type: 'boolean',
			optional: true, nullable: false,
		},
	},
} as const;
