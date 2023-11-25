/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const enumUserSortingSchema = {
	type: 'string',
	enum: [
		'+follower',
		'-follower',
		'+createdAt',
		'-createdAt',
		'+updatedAt',
		'-updatedAt',
	],
} as const;
