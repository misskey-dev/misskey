import { User } from '@/models/entities/user.js';
import { Note } from '@/models/entities/note.js';
import { NoteWatchings } from '@/models/index.js';
import { genId } from '@/misc/gen-id.js';
import { NoteWatching } from '@/models/entities/note-watching.js';

export default async (me: User['id'], note: Note) => {
	// 自分の投稿はwatchできない
	if (me === note.userId) {
		return;
	}

	await NoteWatchings.insert({
		id: genId(),
		createdAt: new Date(),
		noteId: note.id,
		userId: me,
		noteUserId: note.userId,
	} as NoteWatching);
};
