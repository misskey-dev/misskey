/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';

export const packedClipSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	createdAt: mi.dateTimeString(),
	lastClippedAt: v.nullable(mi.dateTimeString()),
	userId: mi.idString(),
	user: packedUserLiteSchema,
	name: v.string(),
	description: v.nullable(v.string()),
	isPublic: v.boolean(),
	favoritedCount: v.number(),
	isFavorited: v.optional(v.boolean()),
	notesCount: v.optional(mi.integer()),
});
mi.defineEntity('Clip', packedClipSchema);

export type PackedClip = v.InferOutput<typeof packedClipSchema>;
