/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';

export const packedFlashSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	createdAt: mi.dateTimeString(),
	updatedAt: mi.dateTimeString(),
	userId: mi.idString(),
	user: packedUserLiteSchema,
	title: v.string(),
	summary: v.string(),
	script: v.string(),
	visibility: v.picklist(['private', 'public']),
	likedCount: v.number(),
	isLiked: v.optional(v.boolean()),
});
mi.defineEntity('Flash', packedFlashSchema);

export type PackedFlash = v.InferOutput<typeof packedFlashSchema>;
