import renderUpdate from '../../../remote/activitypub/renderer/update';
import { renderActivity } from '../../../remote/activitypub/renderer';
import { deliver } from '../../../queue';
import renderNote from '../../../remote/activitypub/renderer/note';
import { Users, Notes, Followings } from '../../../models';
import { Note } from '../../../models/entities/note';

export async function deliverQuestionUpdate(noteId: Note['id']) {
	const note = await Notes.findOne(noteId);

	const user = await Users.findOne(note.userId);

	const followers = await Followings.find({
		followeeId: user.id
	});

	const queue: string[] = [];

	// フォロワーがリモートユーザーかつ投稿者がローカルユーザーならUpdateを配信
	if (Users.isLocalUser(user)) {
		for (const following of followers) {
			const follower = {
				inbox: following.followerInbox,
				sharedInbox: following.followerSharedInbox
			};

			if (following.followerHost !== null) {
				const inbox = follower.sharedInbox || follower.inbox;
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
