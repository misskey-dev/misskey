/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedGalleryPostSchema = {
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
		title: {
			type: 'string',
			optional: false, nullable: false,
		},
		description: {
			type: 'string',
			optional: false, nullable: true,
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
		isSensitive: {
			type: 'boolean',
			optional: false, nullable: false,
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
