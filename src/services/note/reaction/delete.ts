import { IUser, isLocalUser, isRemoteUser } from '../../../models/user';
import Note, { INote } from '../../../models/note';
import Reaction from '../../../models/note-reaction';
import { publishNoteStream } from '../../stream';
import renderLike from '../../../remote/activitypub/renderer/like';
import renderUndo from '../../../remote/activitypub/renderer/undo';
import { renderActivity } from '../../../remote/activitypub/renderer';
import { deliver } from '../../../queue';
import { IdentifiableError } from '../../../misc/identifiable-error';

export default async (user: IUser, note: INote) => {
	// if already unreacted
	const exist = await Reaction.findOne({
		noteId: note._id,
		userId: user._id,
		deletedAt: { $exists: false }
	});

	if (exist === null) {
		throw new IdentifiableError('60527ec9-b4cb-4a88-a6bd-32d3ad26817d', 'not reacted');
	}

	// Delete reaction
	await Reaction.remove({
		_id: exist._id
	});

	const dec: any = {};
	dec[`reactionCounts.${exist.reaction}`] = -1;

	// Decrement reactions count
	Note.update({ _id: note._id }, {
		$inc: dec
	});

	publishNoteStream(note._id, 'unreacted', {
		reaction: exist.reaction,
		userId: user._id
	});

	//#region 配信
	// リアクターがローカルユーザーかつリアクション対象がリモートユーザーの投稿なら配送
	if (isLocalUser(user) && isRemoteUser(note._user)) {
		const content = renderActivity(renderUndo(renderLike(user, note, exist.reaction), user));
		deliver(user, content, note._user.inbox);
	}
	//#endregion

	return;
};
