import Note, { INote } from '../../models/note';
import { IUser, isLocalUser } from '../../models/user';
import { publishNoteStream } from '../../publishers/stream';
import renderDelete from '../../remote/activitypub/renderer/delete';
import pack from '../../remote/activitypub/renderer';
import { deliver } from '../../queue';
import Following from '../../models/following';
import renderNote from '../../remote/activitypub/renderer/note';

/**
 * 投稿を削除します。
 * @param user 投稿者
 * @param note 投稿
 */
export default async function(user: IUser, note: INote) {
	await Note.update({
		_id: note._id,
		userId: user._id
	}, {
		$set: {
			deletedAt: new Date(),
			text: null,
			mediaIds: [],
			poll: null
		}
	});

	publishNoteStream(note._id, 'deleted');

	//#region ローカルの投稿なら削除アクティビティを配送
	if (isLocalUser(user)) {
		const content = pack(renderDelete(await renderNote(note)));

		const followings = await Following.find({
			followeeId: user._id,
			'_follower.host': { $ne: null }
		});

		followings.forEach(following => {
			deliver(user, content, following._follower.inbox);
		});
	}
	//#endregion
}
