/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import type { MiNote } from '@/models/Note.js';

// eslint-disable-next-line import/no-default-export
export default function(note: MiNote): boolean {
	// sync with NoteCreateService.isQuote
	return note.renoteId != null && (note.text != null || note.hasPoll || (note.fileIds != null && note.fileIds.length > 0));
}
