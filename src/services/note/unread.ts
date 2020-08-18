import { Note } from '../../models/entities/note';
import { publishMainStream } from '../stream';
import { User } from '../../models/entities/user';
import { Mutings, NoteUnreads } from '../../models';
import { genId } from '../../misc/gen-id';

export default async function(userId: User['id'], note: Note, params: {
	// NOTE: isSpecifiedがtrueならisMentionedは必ずfalse
	isSpecified?: boolean;
	isMentioned?: boolean;
}) {
	//#region ミュートしているなら無視
	const mute = await Mutings.find({
		muterId: userId
	});
	if (mute.map(m => m.muteeId).includes(note.userId)) return;
	//#endregion

	const unread = await NoteUnreads.save({
		id: genId(),
		noteId: note.id,
		userId: userId,
		isSpecified: params.isSpecified,
		isMentioned: params.isMentioned,
		noteChannelId: note.channelId,
		noteUserId: note.userId,
	});

	// 2秒経っても既読にならなかったら「未読の投稿がありますよ」イベントを発行する
	setTimeout(async () => {
		const exist = await NoteUnreads.findOne(unread.id);
		if (exist == null) return;

		if (params.isMentioned) {
			publishMainStream(userId, 'unreadMention', note.id);
		}
		if (params.isSpecified) {
			publishMainStream(userId, 'unreadSpecifiedNote', note.id);
		}
		if (note.channelId) {
			publishMainStream(userId, 'unreadChannel', note.id);
		}
	}, 2000);
}
