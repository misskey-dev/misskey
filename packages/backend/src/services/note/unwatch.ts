import { User } from '@/models/entities/user';
import { NoteWatchings } from '@/models/index';
import { Note } from '@/models/entities/note';

export default async (me: User['id'], note: Note) => {
	await NoteWatchings.delete({
		noteId: note.id,
		userId: me
	});
};
