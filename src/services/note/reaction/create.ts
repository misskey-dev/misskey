import { User, isLocalUser, isRemoteUser } from '../../../models/entities/user';
import Note, { Note } from '../../../models/entities/note';
import NoteReaction from '../../../models/entities/note-reaction';
import { publishNoteStream } from '../../stream';
import notify from '../../create-notification';
import NoteWatching from '../../../models/entities/note-watching';
import watch from '../watch';
import renderLike from '../../../remote/activitypub/renderer/like';
import { deliver } from '../../../queue';
import { renderActivity } from '../../../remote/activitypub/renderer';
import perUserReactionsChart from '../../chart/charts/per-user-reactions';
import { IdentifiableError } from '../../../misc/identifiable-error';
import { toDbReaction } from '../../../misc/reaction-lib';
import fetchMeta from '../../../misc/fetch-meta';

export default async (user: User, note: Note, reaction: string) => {
	// Myself
	if (note.userId.equals(user.id)) {
		throw new IdentifiableError('2d8e7297-1873-4c00-8404-792c68d7bef0', 'cannot react to my note');
	}

	const meta = await fetchMeta();
	reaction = await toDbReaction(reaction, meta.enableEmojiReaction);

	// Create reaction
	await NoteReaction.insert({
		createdAt: new Date(),
		noteId: note.id,
		userId: user.id,
		reaction
	}).catch(e => {
		// duplicate key error
		if (e.code === 11000) {
			throw new IdentifiableError('51c42bb4-931a-456b-bff7-e5a8a70dd298', 'already reacted');
		}

		throw e;
	});

	// Increment reactions count
	await Note.update({ _id: note.id }, {
		$inc: {
			[`reactionCounts.${reaction}`]: 1,
			score: 1
		}
	});

	perUserReactionsChart.update(user, note);

	publishNoteStream(note.id, 'reacted', {
		reaction: reaction,
		userId: user.id
	});

	// リアクションされたユーザーがローカルユーザーなら通知を作成
	if (isLocalUser(note._user)) {
		notify(note.userId, user.id, 'reaction', {
			noteId: note.id,
			reaction: reaction
		});
	}

	// Fetch watchers
	NoteWatching
		.find({
			noteId: note.id,
			userId: { $ne: user.id }
		}, {
			fields: {
				userId: true
			}
		})
		.then(watchers => {
			for (const watcher of watchers) {
				notify(watcher.userId, user.id, 'reaction', {
					noteId: note.id,
					reaction: reaction
				});
			}
		});

	// ユーザーがローカルユーザーかつ自動ウォッチ設定がオンならばこの投稿をWatchする
	if (isLocalUser(user) && user.autoWatch !== false) {
		watch(user.id, note);
	}

	//#region 配信
	// リアクターがローカルユーザーかつリアクション対象がリモートユーザーの投稿なら配送
	if (isLocalUser(user) && isRemoteUser(note._user)) {
		const content = renderActivity(renderLike(user, note, reaction));
		deliver(user, content, note._user.inbox);
	}
	//#endregion

	return;
};
