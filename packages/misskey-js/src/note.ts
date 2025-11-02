import type { Note, PureRenote } from './entities.js';

export function isPureRenote(note: Note): note is PureRenote {
	return (
		note.renoteId != null &&
		note.replyId == null &&
		note.text == null &&
		note.cw == null &&
		(note.fileIds == null || note.fileIds.length === 0) &&
		note.poll == null
	);
}
