import Vote from '../../../models/poll-vote';
import Note, { INote } from '../../../models/note';
import Watching from '../../../models/note-watching';
import watch from '../../../services/note/watch';
import { publishNoteStream } from '../../../stream';
import notify from '../../../notify';
import createNote from '../../../services/note/create';
import { isLocalUser, IUser, isRemoteUser } from '../../../models/user';
import Following from '../../../models/following';
import packAp from '../../../remote/activitypub/renderer';
import { deliver } from '../../../queue';
import renderUpdate from '../../../remote/activitypub/renderer/update';
import renderQuestion from '../../../remote/activitypub/renderer/question';

export default (user: IUser, note: INote, choice: number) => new Promise(async (res, rej) => {
	if (!note.poll.choices.some(x => x.id == choice)) return rej('invalid choice param');

	// if already voted
	const exist = await Vote.findOne({
		noteId: note._id,
		userId: user._id
	});

	if (exist !== null) {
		return rej('already voted');
	}

	// Create vote
	await Vote.insert({
		createdAt: new Date(),
		noteId: note._id,
		userId: user._id,
		choice: choice
	});

	// Send response
	res();

	const inc: any = {};
	inc[`poll.choices.${note.poll.choices.findIndex(c => c.id == choice)}.votes`] = 1;

	// Increment votes count
	await Note.update({ _id: note._id }, {
		$inc: inc
	});

	publishNoteStream(note._id, 'pollVoted', {
		choice: choice,
		userId: user._id.toHexString()
	});

	// Notify
	notify(note.userId, user._id, 'poll_vote', {
		noteId: note._id,
		choice: choice
	});

	// Fetch watchers
	Watching
		.find({
			noteId: note._id,
			userId: { $ne: user._id },
			// 削除されたドキュメントは除く
			deletedAt: { $exists: false }
		}, {
			fields: {
				userId: true
			}
		})
		.then(watchers => {
			for (const watcher of watchers) {
				notify(watcher.userId, user._id, 'poll_vote', {
					noteId: note._id,
					choice: choice
				});
			}
		});

	// ローカルユーザーが投票した場合この投稿をWatchする
	if (isLocalUser(user) && user.settings.autoWatch !== false) {
		watch(user._id, note);
	}

	// ローカルからリモートへの投票の場合リプライ送信
	if (isLocalUser(user) && note._user.host != null) {
		createNote(user, {
			createdAt: new Date(),
			text: choice.toString(),
			reply: note,
		});
	}

	publishVoteToFollowers(user, note);
});

export async function publishVoteToFollowers(user: IUser, note: INote) {
	const followers = await Following.find({
		followeeId: user._id
	});

	const queue: string[] = [];

	// フォロワーがリモートユーザーかつ投稿者がローカルユーザーならUpdateを配信
	if (isLocalUser(user)) {
		for (const following of followers) {
			const follower = following._follower;

			if (isRemoteUser(follower)) {
				const inbox = follower.sharedInbox || follower.inbox;
				if (!queue.includes(inbox)) queue.push(inbox);
			}
		}

		if (queue.length > 0) {
			const content = packAp(renderUpdate(await renderQuestion(user, note), user));
			for (const inbox of queue) {
				deliver(user, content, inbox);
			}
		}
	}
}
