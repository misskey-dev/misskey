/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedInviteCodeSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		code: {
			type: 'string',
			optional: false, nullable: false,
			example: 'GR6S02ERUA5VR',
		},
		expiresAt: {
			type: 'string',
			optional: false, nullable: true,
			format: 'date-time',
		},
		createdAt: {
			type: 'string',
			optional: false, nullable: false,
			format: 'date-time',
		},
		createdBy: {
			type: 'object',
			optional: false, nullable: true,
			ref: 'UserLite',
		},
		usedBy: {
			type: 'object',
			optional: false, nullable: true,
			ref: 'UserLite',
		},
		usedAt: {
			type: 'string',
			optional: false, nullable: true,
			format: 'date-time',
		},
		used: {
			type: 'boolean',
			optional: false, nullable: false,
		},
	},
} as const;
