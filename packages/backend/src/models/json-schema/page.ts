/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const blockBaseSchema = {
	type: 'object',
	properties: {
		id: {
			type: 'string',
			optional: false, nullable: false,
		},
		type: {
			type: 'string',
			optional: false, nullable: false,
		},
	},
} as const;

const textBlockSchema = {
	type: 'object',
	properties: {
		...blockBaseSchema.properties,
		type: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['text'],
		},
		text: {
			type: 'string',
			optional: false, nullable: false,
		},
	},
} as const;

const sectionBlockSchema = {
	type: 'object',
	properties: {
		...blockBaseSchema.properties,
		type: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['section'],
		},
		title: {
			type: 'string',
			optional: false, nullable: false,
		},
		children: {
			type: 'array',
			optional: false, nullable: false,
			items: {
				type: 'object',
				optional: false, nullable: false,
				ref: 'PageBlock',
				selfRef: true,
			},
		},
	},
} as const;

const imageBlockSchema = {
	type: 'object',
	properties: {
		...blockBaseSchema.properties,
		type: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['image'],
		},
		fileId: {
			type: 'string',
			optional: false, nullable: true,
		},
	},
} as const;

const noteBlockSchema = {
	type: 'object',
	properties: {
		...blockBaseSchema.properties,
		type: {
			type: 'string',
			optional: false, nullable: false,
			enum: ['note'],
		},
		detailed: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		note: {
			type: 'string',
			optional: false, nullable: true,
		},
	},
} as const;

export const packedPageBlockSchema = {
	type: 'object',
	oneOf: [
		textBlockSchema,
		sectionBlockSchema,
		imageBlockSchema,
		noteBlockSchema,
	],
} as const;

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
				ref: 'PageBlock',
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
