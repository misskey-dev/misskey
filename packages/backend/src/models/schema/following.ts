/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserDetailedNotMeSchema } from '@/models/schema/user.js';

export const packedFollowingSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	createdAt: mi.dateTimeString(),
	followeeId: mi.idString(),
	followerId: mi.idString(),
	followee: v.optional(packedUserDetailedNotMeSchema),
	follower: v.optional(packedUserDetailedNotMeSchema),
});
mi.defineEntity('Following', packedFollowingSchema);

export type PackedFollowing = v.InferOutput<typeof packedFollowingSchema>;
