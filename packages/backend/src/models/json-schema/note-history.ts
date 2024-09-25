/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedNoteHistorySchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		targetId: {
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
		text: {
			type: 'string',
			optional: true, nullable: true,
		},
		cw: {
			type: 'string',
			optional: true, nullable: true,
		},
		mentions: {
			type: 'array',
			optional: true, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
		fileIds: {
			type: 'array',
			optional: true, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
		files: {
			type: 'array',
			optional: true, nullable: false,
			items: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'DriveFile',
			},
		},
		tags: {
			type: 'array',
			optional: true, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
			},
		},
		poll: {
			type: 'object',
			optional: true, nullable: true,
			properties: {
				expiresAt: {
					type: 'string',
					optional: true, nullable: true,
					format: 'date-time',
				},
				multiple: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				choices: {
					type: 'array',
					optional: false, nullable: false,
					items: {
						type: 'object',
						optional: false, nullable: false,
						properties: {
							isVoted: {
								type: 'boolean',
								optional: false, nullable: false,
							},
							text: {
								type: 'string',
								optional: false, nullable: false,
							},
							votes: {
								type: 'number',
								optional: false, nullable: false,
							},
						},
					},
				},
			},
		},
		emojis: {
			type: 'object',
			optional: true, nullable: false,
			additionalProperties: {
				anyOf: [{
					type: 'string',
				}],
			},
		},
	},
} as const;
