import { publishMainStream } from '../stream';
import { Note } from '../../models/entities/note';
import { User } from '../../models/entities/user';
import { NoteUnreads } from '../../models';

/**
 * Mark a note as read
 */
export default (
	userId: User['id'],
	noteId: Note['id']
) => new Promise<unknown>(async (resolve, reject) => {
	// Remove document
	/*const res = */await NoteUnreads.delete({
		userId: userId,
		noteId: noteId
	});

	// v11 TODO: https://github.com/typeorm/typeorm/issues/2415
	//if (res.affected == 0) {
	//	return;
	//}

	const count1 = await NoteUnreads.count({
		userId: userId,
		isSpecified: false
	});

	const count2 = await NoteUnreads.count({
		userId: userId,
		isSpecified: true
	});

	if (count1 == 0) {
		// 全て既読になったイベントを発行
		publishMainStream(userId, 'readAllUnreadMentions');
	}

	if (count2 == 0) {
		// 全て既読になったイベントを発行
		publishMainStream(userId, 'readAllUnreadSpecifiedNotes');
	}
});
