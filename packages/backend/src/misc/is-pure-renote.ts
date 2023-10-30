import type { MiNote } from '@/models/Note.js';

export function isPureRenote(note: MiNote): boolean {
	if (!note.renoteId) return false;

	if (note.text) return false; // it's quoted with text
	if (note.fileIds.length !== 0) return false; // it's quoted with files
	if (note.hasPoll) return false; // it's quoted with poll
	return true;
}
