/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedNoteSchema } from '@/models/schema/note.js';

export const packedChannelSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	createdAt: mi.dateTimeString(),
	lastNotedAt: v.nullable(mi.dateTimeString()),
	name: v.string(),
	description: v.nullable(v.string()),
	userId: v.nullable(mi.idString()),
	bannerUrl: v.nullable(mi.urlString()),
	bannerId: v.nullable(mi.idString()),
	pinnedNoteIds: v.array(mi.idString()),
	color: v.string(),
	isArchived: v.boolean(),
	usersCount: v.number(),
	notesCount: v.number(),
	isSensitive: v.boolean(),
	allowRenoteToExternal: v.boolean(),
	isFollowing: v.optional(v.boolean()),
	isFavorited: v.optional(v.boolean()),
	isMuting: v.optional(v.boolean()),
	pinnedNotes: v.optional(v.array(packedNoteSchema)),
});
mi.defineEntity('Channel', packedChannelSchema);

export type PackedChannel = v.InferOutput<typeof packedChannelSchema>;
