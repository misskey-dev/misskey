/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedNoteDraftSchema = {
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
		text: {
			type: 'string',
			optional: false, nullable: true,
		},
		cw: {
			type: 'string',
			optional: false, nullable: true,
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
		replyId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		renoteId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		reply: {
			type: 'object',
			optional: true, nullable: true,
			ref: 'Note',
		},
		renote: {
			type: 'object',
			optional: true, nullable: true,
			ref: 'Note',
		},
		visibility: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['public', 'home', 'followers', 'specified'],
		},
		visibleUserIds: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'string',
				optional: false, nullable: false,
				format: 'id',
			},
		},
		fileIds: {
			type: 'array',
			optional: false, nullable: false,
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
		hashtag: {
			type: 'string',
			optional: false, nullable: true,
		},
		poll: {
			type: 'object',
			optional: false, nullable: true,
			properties: {
				expiresAt: {
					type: 'string',
					optional: true, nullable: true,
					format: 'date-time',
				},
				expiredAfter: {
					type: 'number',
					optional: true, nullable: true,
				},
				multiple: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				choices: {
					type: 'array',
					optional: false, nullable: false,
					items: {
						type: 'string',
						optional: false, nullable: false,
					},
				},
			},
		},
		channelId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
		},
		channel: {
			type: 'object',
			optional: true, nullable: true,
			properties: {
				id: {
					type: 'string',
					optional: false, nullable: false,
				},
				name: {
					type: 'string',
					optional: false, nullable: false,
				},
				color: {
					type: 'string',
					optional: false, nullable: false,
				},
				isSensitive: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				allowRenoteToExternal: {
					type: 'boolean',
					optional: false, nullable: false,
				},
				userId: {
					type: 'string',
					optional: false, nullable: true,
				},
			},
		},
		localOnly: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		reactionAcceptance: {
			type: 'string',
			optional: false, nullable: true,
			enum: ['likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote', null],
		},
		scheduledAt: {
			type: 'number',
			optional: false, nullable: true,
		},
		isActuallyScheduled: {
			type: 'boolean',
			optional: false, nullable: false,
		},
	},
} as const;
