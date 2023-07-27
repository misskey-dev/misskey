/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedDriveFileSchema = {
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
		name: {
			type: 'string',
			optional: false, nullable: false,
			example: 'lenna.jpg',
		},
		type: {
			type: 'string',
			optional: false, nullable: false,
			example: 'image/jpeg',
		},
		md5: {
			type: 'string',
			optional: false, nullable: false,
			format: 'md5',
			example: '15eca7fba0480996e2245f5185bf39f2',
		},
		size: {
			type: 'number',
			optional: false, nullable: false,
			example: 51469,
		},
		isSensitive: {
			type: 'boolean',
			optional: false, nullable: false,
		},
		blurhash: {
			type: 'string',
			optional: false, nullable: true,
		},
		properties: {
			type: 'object',
			optional: false, nullable: false,
			properties: {
				width: {
					type: 'number',
					optional: true, nullable: false,
					example: 1280,
				},
				height: {
					type: 'number',
					optional: true, nullable: false,
					example: 720,
				},
				orientation: {
					type: 'number',
					optional: true, nullable: false,
					example: 8,
				},
				avgColor: {
					type: 'string',
					optional: true, nullable: false,
					example: 'rgb(40,65,87)',
				},
			},
		},
		url: {
			type: 'string',
			optional: false, nullable: true,
			format: 'url',
		},
		thumbnailUrl: {
			type: 'string',
			optional: false, nullable: true,
			format: 'url',
		},
		comment: {
			type: 'string',
			optional: false, nullable: true,
		},
		folderId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		folder: {
			type: 'object',
			optional: true, nullable: true,
			ref: 'DriveFolder',
		},
		userId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		user: {
			type: 'object',
			optional: true, nullable: true,
			ref: 'UserLite',
		},
	},
} as const;
