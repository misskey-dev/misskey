/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { ACHIEVEMENT_TYPES } from '@/models/UserProfile.js';

export const packedAchievementNameSchema = {
	type: 'string',
	enum: ACHIEVEMENT_TYPES,
	optional: false,
} as const;

export const packedAchievementSchema = {
	type: 'object',
	properties: {
		name: {
			ref: 'AchievementName',
		},
		unlockedAt: {
			type: 'number',
			optional: false,
		},
	},
} as const;
