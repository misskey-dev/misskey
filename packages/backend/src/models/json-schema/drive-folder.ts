/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const packedDriveFolderSchema = {
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
		},
		foldersCount: {
			type: 'number',
			optional: true, nullable: false,
		},
		filesCount: {
			type: 'number',
			optional: true, nullable: false,
		},
		parentId: {
			type: 'string',
			optional: false, nullable: true,
			format: 'id',
			example: 'xxxxxxxxxx',
		},
		parent: {
			type: 'object',
			optional: true, nullable: true,
			ref: 'DriveFolder',
		},
	},
} as const;
