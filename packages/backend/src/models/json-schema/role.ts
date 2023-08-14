/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedRoleSchema = {
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
			optional: false, nullable: false,
			format: 'date-time',
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		description: {
			type: 'string',
			optional: false, nullable: false,
		},
		color: {
			type: 'string',
			optional: false, nullable: true,
		},
		iconUrl: {
			type: 'string',
			format: 'url',
			optional: false, nullable: true,
		},
		target: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['manual', 'conditional'],
		},
		condFormula: {
			type: 'object',
			optional: false, nullable: false,
		},
		isPublic: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isAdministrator: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isModerator: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		isExplorable: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		asBadge: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		canEditMembersByModerator: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		displayOrder: {
			type: 'number',
			optional: false, nullable: false,
		},
		policies: {
			type: 'object',
			optional: false, nullable: false,
			patternProperties: {
				'^': {
					type: 'object',
					nullable: false, optional: false,
					properties: {
						useDefault: {
							type: 'boolean',
							nullable: false, optional: false,
						},
						priority: {
							type: 'number',
							nullable: false, optional: false,
						},
						value: {
							type: 'object',
							nullable: false, optional: false,
						},
					},
				},
			},
		},
		usersCount: {
			type: 'number',
			optional: false, nullable: false,
		},
	},
} as const;
