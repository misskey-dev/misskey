/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedBlockingSchema = {
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
		blockeeId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		blockee: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'UserDetailedNotMe',
		},
		blockType: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['user', 'reaction'],
		},
	},
} as const;
