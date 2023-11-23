/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedPageSchema = {
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
		content: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'object',
				optional: false, nullable: false,
			},
		},
		variables: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'object',
				optional: false, nullable: false,
			},
		},
		title: {
			type: 'string',
			optional: false, nullable: false,
		},
		name: {
			type: 'string',
			optional: false, nullable: false,
		},
		summary: {
			type: 'string',
			optional: false, nullable: true,
		},
		hideTitleWhenPinned: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		alignCenter: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		font: {
			type: 'string',
			optional: false, nullable: false,
		},
		script: {
			type: 'string',
			optional: false, nullable: false,
		},
		eyeCatchingImageId: {
			type: 'string',
			optional: false, nullable: true,
		},
		eyeCatchingImage: {
			type: 'object',
			optional: false, nullable: true,
			ref: 'DriveFile',
		},
		attachedFiles: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'DriveFile',
			},
		},
		likedCount: {
			type: 'number',
			optional: false, nullable: false,
		},
		isLiked: {
			type: 'boolean',
			optional: true, nullable: false,
		},
	},
} as const;
