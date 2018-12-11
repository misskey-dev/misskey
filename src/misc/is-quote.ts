import { INote } from '../models/note';

export default function(note: INote): boolean {
	return !!(note.renoteId && (note.text || note.poll || (note.fileIds && note.fileIds.length)));
}
