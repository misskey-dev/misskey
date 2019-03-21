import NoteUnread from '../../models/note-unread';
import User, { IUser } from '../../models/user';
import { INote } from '../../models/note';
import Mute from '../../models/mute';
import { publishMainStream } from '../stream';

export default async function(user: IUser, note: INote, isSpecified = false) {
	//#region ミュートしているなら無視
	const mute = await Mute.find({
		muterId: user.id
	});
	const mutedUserIds = mute.map(m => m.muteeId.toString());
	if (mutedUserIds.includes(note.userId.toString())) return;
	//#endregion

	const unread = await NoteUnread.insert({
		noteId: note.id,
		userId: user.id,
		isSpecified,
		_note: {
			userId: note.userId
		}
	});

	// 2秒経っても既読にならなかったら「未読の投稿がありますよ」イベントを発行する
	setTimeout(async () => {
		const exist = await NoteUnread.findOne({ _id: unread.id });
		if (exist == null) return;

		User.update({
			_id: user.id
		}, {
			$set: isSpecified ? {
				hasUnreadSpecifiedNotes: true,
				hasUnreadMentions: true
			} : {
				hasUnreadMentions: true
			}
		});

		publishMainStream(user.id, 'unreadMention', note.id);

		if (isSpecified) {
			publishMainStream(user.id, 'unreadSpecifiedNote', note.id);
		}
	}, 2000);
}
