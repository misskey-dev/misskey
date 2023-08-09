/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
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
		display: {
			type: 'string',
			optional: false, nullable: false,
		},
		isRead: {
			type: 'boolean',
			optional: true, nullable: false,
		},
	},
} as const;
