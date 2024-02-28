/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedOAuth2ServerSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		description: {
			type: 'string',
			optional: true, nullable: true,
		},
		iconUrl: {
			type: 'string',
			optional: true, nullable: true,
		},
		allowSignUp: {
			type: 'boolean',
			optional: false, nullable: false,
		},
	},
} as const;
