import * as mongo from 'mongodb';
import { publishUserStream } from '../../stream';
import User from '../../models/user';
import NoteUnread from '../../models/note-unread';

/**
 * Mark a note as read
 */
export default (
	user: string | mongo.ObjectID,
	note: string | mongo.ObjectID
) => new Promise<any>(async (resolve, reject) => {

	const userId: mongo.ObjectID = mongo.ObjectID.prototype.isPrototypeOf(user)
		? user as mongo.ObjectID
		: new mongo.ObjectID(user);

	const noteId: mongo.ObjectID = mongo.ObjectID.prototype.isPrototypeOf(note)
		? note as mongo.ObjectID
		: new mongo.ObjectID(note);

	// Remove document
	await NoteUnread.remove({
		userId: userId,
		noteId: noteId
	});

	const count1 = await NoteUnread
		.count({
			userId: userId,
			isSpecified: false
		}, {
			limit: 1
		});

	const count2 = await NoteUnread
		.count({
			userId: userId,
			isSpecified: true
		}, {
			limit: 1
		});

	if (count1 == 0 || count2 == 0) {
		User.update({ _id: userId }, {
			$set: {
				hasUnreadMentions: count1 != 0 || count2 != 0,
				hasUnreadSpecifiedNotes: count2 != 0
			}
		});
	}

	if (count1 == 0) {
		// 全て既読になったイベントを発行
		publishUserStream(userId, 'readAllUnreadMentions');
	}

	if (count2 == 0) {
		// 全て既読になったイベントを発行
		publishUserStream(userId, 'readAllUnreadSpecifiedNotes');
	}
});
