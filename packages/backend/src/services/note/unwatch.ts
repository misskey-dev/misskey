import { User } from '@/models/entities/user.js';
import { NoteWatchings } from '@/models/index.js';
import { Note } from '@/models/entities/note.js';

export default async (me: User['id'], note: Note) => {
	await NoteWatchings.delete({
		noteId: note.id,
		userId: me,
	});
};
