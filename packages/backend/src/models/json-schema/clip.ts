/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedClipSchema = {
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
		lastClippedAt: {
			type: 'string',
			optional: false, nullable: true,
			format: 'date-time',
		},
		userId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		user: {
			type: 'object',
			ref: 'UserLite',
			optional: false, nullable: false,
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		description: {
			type: 'string',
			optional: false, nullable: true,
		},
		isPublic: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		favoritedCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		isFavorited: {
			type: 'boolean',
			optional: true, nullable: false,
		},
	},
} as const;
