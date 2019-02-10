import { IUser, isLocalUser, isRemoteUser } from '../../../models/user';
import Note, { INote } from '../../../models/note';
import NoteReaction from '../../../models/note-reaction';
import { publishNoteStream } from '../../stream';
import notify from '../../create-notification';
import NoteWatching from '../../../models/note-watching';
import watch from '../watch';
import renderLike from '../../../remote/activitypub/renderer/like';
import { deliver } from '../../../queue';
import { renderActivity } from '../../../remote/activitypub/renderer';
import perUserReactionsChart from '../../../services/chart/per-user-reactions';

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
			return rej('already reacted');
		}

		return rej('something happened');
	}

	res();

	// Increment reactions count
	await Note.update({ _id: note._id }, {
		$inc: {
			[`reactionCounts.${reaction}`]: 1,
			score: 1
		}
	});

	perUserReactionsChart.update(user, note);

	publishNoteStream(note._id, 'reacted', {
		reaction: reaction,
		userId: user._id
	});

	// リアクションされたユーザーがローカルユーザーなら通知を作成
	if (isLocalUser(note._user)) {
		notify(note.userId, user._id, 'reaction', {
			noteId: note._id,
			reaction: reaction
		});
	}

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
			for (const watcher of watchers) {
				notify(watcher.userId, user._id, 'reaction', {
					noteId: note._id,
					reaction: reaction
				});
			}
		});

	// ユーザーがローカルユーザーかつ自動ウォッチ設定がオンならばこの投稿をWatchする
	if (isLocalUser(user) && user.settings.autoWatch !== false) {
		watch(user._id, note);
	}

	//#region 配信
	// リアクターがローカルユーザーかつリアクション対象がリモートユーザーの投稿なら配送
	if (isLocalUser(user) && isRemoteUser(note._user)) {
		const content = renderActivity(renderLike(user, note, reaction));
		deliver(user, content, note._user.inbox);
	}
	//#endregion
});
