import { IUser, pack as packUser, isLocalUser, isRemoteUser } from '../../../models/user';
import Note, { INote, pack as packNote } from '../../../models/note';
import NoteReaction from '../../../models/note-reaction';
import { publishNoteStream } from '../../../publishers/stream';
import notify from '../../../publishers/notify';
import pushSw from '../../../publishers/push-sw';
import NoteWatching from '../../../models/note-watching';
import watch from '../watch';
import renderLike from '../../../remote/activitypub/renderer/like';
import { deliver } from '../../../queue';
import pack from '../../../remote/activitypub/renderer';

export default async (user: IUser, note: INote, reaction: string) => new Promise(async (res, rej) => {
	// Myself
	if (note.userId.equals(user._id)) {
		return rej('cannot react to my note');
	}

	// Create reaction
	try {
		await NoteReaction.insert({
			createdAt: new Date(),
			noteId: note._id,
			userId: user._id,
			reaction
		});
	} catch (e) {
		// duplicate key error
		if (e.code === 11000) {
			return res(null);
		}

		console.error(e);
		return rej('something happened');
	}

	res();

	const inc = {};
	inc[`reactionCounts.${reaction}`] = 1;

	// Increment reactions count
	await Note.update({ _id: note._id }, {
		$inc: inc
	});

	publishNoteStream(note._id, 'reacted');

	// リアクションされたユーザーがローカルユーザーなら通知を作成
	if (isLocalUser(note._user)) {
		notify(note.userId, user._id, 'reaction', {
			noteId: note._id,
			reaction: reaction
		});
	}

	pushSw(note.userId, 'reaction', {
		user: await packUser(user, note.userId),
		note: await packNote(note, note.userId),
		reaction: reaction
	});

	// Fetch watchers
	NoteWatching
		.find({
			noteId: note._id,
			userId: { $ne: user._id }
		}, {
			fields: {
				userId: true
			}
		})
		.then(watchers => {
			watchers.forEach(watcher => {
				notify(watcher.userId, user._id, 'reaction', {
					noteId: note._id,
					reaction: reaction
				});
			});
		});

	// ユーザーがローカルユーザーかつ自動ウォッチ設定がオンならばこの投稿をWatchする
	if (isLocalUser(user) && user.settings.autoWatch !== false) {
		watch(user._id, note);
	}

	//#region 配信
	// リアクターがローカルユーザーかつリアクション対象がリモートユーザーの投稿なら配送
	if (isLocalUser(user) && isRemoteUser(note._user)) {
		const content = pack(renderLike(user, note, reaction));
		deliver(user, content, note._user.inbox);
	}
	//#endregion
});
