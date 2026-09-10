/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';
import { packedNoteSchema } from '@/models/schema/note.js';
import { packedDriveFileSchema } from '@/models/schema/drive-file.js';

export const packedNoteDraftSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	createdAt: mi.dateTimeString(),
	text: v.nullable(v.string()),
	cw: v.nullable(v.string()),
	userId: mi.idString(),
	user: packedUserLiteSchema,
	replyId: v.nullable(mi.idString()),
	renoteId: v.nullable(mi.idString()),
	reply: v.nullish(packedNoteSchema),
	renote: v.nullish(packedNoteSchema),
	visibility: v.picklist(['public', 'home', 'followers', 'specified']),
	visibleUserIds: v.array(mi.idString()),
	fileIds: v.array(mi.idString()),
	files: v.optional(v.array(packedDriveFileSchema)),
	hashtag: v.nullable(v.string()),
	poll: v.nullable(v.object({
		expiresAt: v.optional(v.nullable(mi.dateTimeString())),
		expiredAfter: v.optional(v.nullable(v.number())),
		multiple: v.boolean(),
		choices: v.array(v.string()),
	})),
	channelId: v.nullable(mi.idString()),
	channel: v.optional(v.nullable(v.object({
		id: v.string(),
		name: v.string(),
		color: v.string(),
		isSensitive: v.boolean(),
		allowRenoteToExternal: v.boolean(),
		userId: v.nullable(v.string()),
	}))),
	localOnly: v.boolean(),
	reactionAcceptance: mi.nullableEnum(['likeOnly', 'likeOnlyForRemote', 'nonSensitiveOnly', 'nonSensitiveOnlyForLocalLikeOnlyForRemote', null]),
	scheduledAt: v.nullable(v.number()),
	isActuallyScheduled: v.boolean(),
});
mi.defineEntity('NoteDraft', packedNoteDraftSchema);

export type PackedNoteDraft = v.InferOutput<typeof packedNoteDraftSchema>;
