/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { ACHIEVEMENT_TYPES } from '@/models/UserProfile.js';

export const packedAchievementNameSchema = v.picklist([...ACHIEVEMENT_TYPES]);
mi.defineEntity('AchievementName', packedAchievementNameSchema);

export type PackedAchievementName = v.InferOutput<typeof packedAchievementNameSchema>;

export const packedAchievementSchema = v.object({
	name: packedAchievementNameSchema,
	unlockedAt: v.number(),
});
mi.defineEntity('Achievement', packedAchievementSchema);

export type PackedAchievement = v.InferOutput<typeof packedAchievementSchema>;
