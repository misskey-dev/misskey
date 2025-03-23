/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type NoteCompat = {
	id: string;
	reply?: NoteCompat | null;
	renote?: NoteCompat | null;
}

export function isMutingNoteRelated(note: NoteCompat, noteIds: Set<string>) {
	if (noteIds.has(note.id)) {
		return true;
	}

	if (note.reply != null && noteIds.has(note.reply.id)) {
		return true;
	}

	if (note.renote != null && noteIds.has(note.renote.id)) {
		return true;
	}

	return false;
}
