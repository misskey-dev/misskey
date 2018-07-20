import { INote } from '../models/note';

export default function(note: INote): boolean {
	return note.renoteId != null && (note.text != null || note.poll != null || (note.mediaIds != null && note.mediaIds.length > 0));
}
