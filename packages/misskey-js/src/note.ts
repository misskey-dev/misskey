import type { Note, Renote } from './entities.js';

export function isRenote(note: Note): note is Renote {
	return (
		note.renote != null &&
		note.reply == null &&
		note.text == null &&
		note.cw == null &&
		(note.fileIds == null || note.fileIds.length === 0) &&
		note.poll == null
	);
}
