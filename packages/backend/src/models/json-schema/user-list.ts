/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedUserListSchema = {
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
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		userIds: {
			type: 'array',
			nullable: false, optional: true,
			items: {
				type: 'string',
				nullable: false, optional: false,
				format: 'id',
			},
		},
		isPublic: {
			type: 'boolean',
			nullable: false,
			optional: false,
		},
	},
} as const;
