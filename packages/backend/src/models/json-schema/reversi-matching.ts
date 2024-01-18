/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedReversiMatchingSchema = {
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
		parentId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		parent: {
			type: 'object',
			optional: false, nullable: true,
			ref: 'User',
		},
		childId: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
		},
		child: {
			type: 'object',
			optional: false, nullable: false,
			ref: 'User',
		},
	},
} as const;
