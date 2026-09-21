/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import * as v from 'valibot';
import * as mi from '@/misc/schema/index.js';
import { packedNoteSchema } from '@/models/schema/note.js';

export const packedNoteFavoriteSchema = v.object({
	id: mi.example(mi.idString(), 'xxxxxxxxxx'),
	createdAt: mi.dateTimeString(),
	note: packedNoteSchema,
	noteId: mi.idString(),
});
mi.defineEntity('NoteFavorite', packedNoteFavoriteSchema);

export type PackedNoteFavorite = v.InferOutput<typeof packedNoteFavoriteSchema>;
