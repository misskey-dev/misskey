/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedAppSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		callbackUrl: {
			type: 'string',
			optional: false, nullable: true,
		},
		permission: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
		secret: {
			type: 'string',
			optional: true, nullable: false,
		},
		isAuthorized: {
			type: 'boolean',
			optional: true, nullable: false,
		},
	},
} as const;
