import { publishMainStream } from '../stream';
import { Note } from '../../models/entities/note';
import { User } from '../../models/entities/user';
import { NoteUnreads } from '../../models';
import { In } from 'typeorm';

/**
 * Mark a specified note as read
 */
export async function readSpecifiedNote(
	userId: User['id'],
	noteIds: Note['id'][]
) {
	// Remove the records
	await NoteUnreads.delete({
		userId: userId,
		noteId: In(noteIds),
	});

	const specifiedCount = await NoteUnreads.count({
		userId: userId,
		isSpecified: true
	});

	if (specifiedCount === 0) {
		// 全て既読になったイベントを発行
		publishMainStream(userId, 'readAllUnreadSpecifiedNotes');
	}
}
