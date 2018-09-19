import NoteUnread from '../../models/note-unread';
import User, { IUser } from '../../models/user';
import { INote } from '../../models/note';
import Mute from '../../models/mute';
import { publishUserStream } from '../../stream';

export default async function(user: IUser, note: INote, isSpecified = false) {
	const unread = await NoteUnread.insert({
		noteId: note._id,
		userId: user._id,
		isSpecified,
		_note: {
			userId: note.userId
		}
	});

	// 3秒経っても既読にならなかったら「未読の投稿がありますよ」イベントを発行する
	setTimeout(async () => {
		const exist = await NoteUnread.findOne({ _id: unread._id });
		if (exist == null) return;

		//#region ただしミュートされているなら発行しない
		const mute = await Mute.find({
			muterId: user._id
		});
		const mutedUserIds = mute.map(m => m.muteeId.toString());
		if (mutedUserIds.includes(note.userId.toString())) return;
		//#endregion

		User.update({
			_id: user._id
		}, {
			$set: isSpecified ? {
				hasUnreadSpecifiedNotes: true,
				hasUnreadMentions: true
			} : {
				hasUnreadMentions: true
			}
		});

		publishUserStream(user._id, 'unreadMention', note._id);

		if (isSpecified) {
			publishUserStream(user._id, 'unreadSpecifiedNote', note._id);
		}
	}, 3000);
}
