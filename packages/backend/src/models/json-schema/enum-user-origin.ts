/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export const enumUserOriginSchema = {
	type: 'string',
	enum: ['combined', 'local', 'remote'],
} as const;
