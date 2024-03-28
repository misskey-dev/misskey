/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiNote } from '@/models/Note.js';

export function isPureRenote(note: MiNote): note is MiNote & { renoteId: NonNullable<MiNote['renoteId']> } {
	if (!note.renoteId) return false;

	if (note.text) return false; // it's quoted with text
	if (note.fileIds.length !== 0) return false; // it's quoted with files
	if (note.hasPoll) return false; // it's quoted with poll
	return true;
}
