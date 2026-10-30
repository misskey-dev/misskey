/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedUserLiteSchema } from '@/models/schema/user.js';
import { packedNoteSchema } from '@/models/schema/note.js';

export const packedNoteReactionSchema = v.object({
	id: mi.idString(),
	createdAt: mi.dateTimeString(),
	user: packedUserLiteSchema,
	type: v.string(),
});
mi.defineEntity('NoteReaction', packedNoteReactionSchema);

export type PackedNoteReaction = v.InferOutput<typeof packedNoteReactionSchema>;

export const packedNoteReactionWithNoteSchema = v.object({
	id: mi.idString(),
	createdAt: mi.dateTimeString(),
	user: packedUserLiteSchema,
	type: v.string(),
	note: packedNoteSchema,
});
mi.defineEntity('NoteReactionWithNote', packedNoteReactionWithNoteSchema);

export type PackedNoteReactionWithNote = v.InferOutput<typeof packedNoteReactionWithNoteSchema>;
