import { INote } from '../models/note';

export default function(note: INote): boolean {
	return note.renoteId != null && (note.text != null || note.poll != null || (note.fileIds != null && note.fileIds.length > 0));
}
