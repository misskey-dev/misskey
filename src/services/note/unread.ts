import { Note } from '../../models/entities/note';
import { publishMainStream } from '../stream';
import { User } from '../../models/entities/user';
import { Mutings, NoteUnreads, Users } from '../../models';
import { genId } from '../../misc/gen-id';

export default async function(user: User, note: Note, params: {
	// NOTE: isSpecifiedがtrueならisMentionedは必ずfalse
	isSpecified?: boolean;
	isMentioned?: boolean;
}) {
	// ローカルユーザーのみ
	if (!Users.isLocalUser(user)) return;

	//#region ミュートしているなら無視
	const mute = await Mutings.find({
		muterId: user.id
	});
	if (mute.map(m => m.muteeId).includes(note.userId)) return;
	//#endregion

	const unread = await NoteUnreads.save({
		id: genId(),
		noteId: note.id,
		userId: user.id,
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
			publishMainStream(user.id, 'unreadMention', note.id);
		} else if (params.isSpecified) {
			publishMainStream(user.id, 'unreadSpecifiedNote', note.id);
		}
	}, 2000);
}
