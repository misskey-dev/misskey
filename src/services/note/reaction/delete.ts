import { publishNoteStream } from '../../stream';
import renderLike from '../../../remote/activitypub/renderer/like';
import renderUndo from '../../../remote/activitypub/renderer/undo';
import { renderActivity } from '../../../remote/activitypub/renderer';
import { deliver } from '../../../queue';
import { IdentifiableError } from '../../../misc/identifiable-error';
import { User } from '../../../models/entities/user';
import { Note } from '../../../models/entities/note';
import { NoteReactions, Users } from '../../../models';

export default async (user: User, note: Note) => {
	// if already unreacted
	const exist = await NoteReactions.findOne({
		noteId: note.id,
		userId: user.id,
	});

	if (exist === null) {
		throw new IdentifiableError('60527ec9-b4cb-4a88-a6bd-32d3ad26817d', 'not reacted');
	}

	// Delete reaction
	await NoteReactions.delete(exist.id);

	const dec: any = {};
	dec[`reactionCounts.${exist.reaction}`] = -1;

	// Decrement reactions count
	Note.update({ _id: note.id }, {
		$inc: dec
	});

	publishNoteStream(note.id, 'unreacted', {
		reaction: exist.reaction,
		userId: user.id
	});

	//#region 配信
	// リアクターがローカルユーザーかつリアクション対象がリモートユーザーの投稿なら配送
	if (Users.isLocalUser(user) && Users.isRemoteUser(note._user)) {
		const content = renderActivity(renderUndo(renderLike(user, note, exist.reaction), user));
		deliver(user, content, note._user.inbox);
	}
	//#endregion
};
