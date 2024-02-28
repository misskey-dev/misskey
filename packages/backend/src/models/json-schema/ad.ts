/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedAdSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false,
			nullable: false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		expiresAt: {
			type: 'string',
			optional: false,
			nullable: false,
			format: 'date-time',
		},
		startsAt: {
			type: 'string',
			optional: false,
			nullable: false,
			format: 'date-time',
		},
		place: {
			type: 'string',
			optional: false,
			nullable: false,
		},
		priority: {
			type: 'string',
			optional: false,
			nullable: false,
		},
		ratio: {
			type: 'number',
			optional: false,
			nullable: false,
		},
		url: {
			type: 'string',
			optional: false,
			nullable: false,
		},
		imageUrl: {
			type: 'string',
			optional: false,
			nullable: false,
		},
		memo: {
			type: 'string',
			optional: false,
			nullable: false,
		},
		dayOfWeek: {
			type: 'integer',
			optional: false,
			nullable: false,
		},
	},
} as const;
