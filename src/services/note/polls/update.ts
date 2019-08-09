import renderUpdate from '~/remote/activitypub/renderer/update';
import { renderActivity } from '~/remote/activitypub/renderer';
import { deliver } from '~/queue';
import renderNote from '~/remote/activitypub/renderer/note';
import { Users, Notes, Followings } from '~/models';
import { Note } from '~/models/entities/note';

export async function deliverQuestionUpdate(noteId: Note['id']) {
	const note = await Notes.findOne(noteId);
	if (note == null) throw new Error('note not found');

	const user = await Users.findOne(note.userId);
	if (user == null) throw new Error('note not found');

	const followers = await Followings.find({
		followeeId: user.id
	});

	const queue: string[] = [];

	// フォロワーがリモートユーザーかつ投稿者がローカルユーザーならUpdateを配信
	if (Users.isLocalUser(user)) {
		for (const following of followers) {
			if (Followings.isRemoteFollower(following)) {
				const inbox = following.followerSharedInbox || following.followerInbox;
				if (!queue.includes(inbox)) queue.push(inbox);
			}
		}

		if (queue.length > 0) {
			const content = renderActivity(renderUpdate(await renderNote(note, false), user));
			for (const inbox of queue) {
				deliver(user, content, inbox);
			}
		}
	}
}
