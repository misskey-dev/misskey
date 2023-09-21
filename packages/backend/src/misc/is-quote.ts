import type { Note } from '@/models/entities/Note.js';

export default function(note: Note): boolean {
	return note.renoteId != null && (note.text != null || note.hasPoll || (note.fileIds != null && note.fileIds.length > 0));
}
