import { updateQuestion } from '../../../remote/activitypub/models/question';
import ms = require('ms');
import Logger from '../../logger';
import renderUpdate from '../../../remote/activitypub/renderer/update';
import { renderActivity } from '../../../remote/activitypub/renderer';
import { deliver } from '../../../queue';
import renderNote from '../../../remote/activitypub/renderer/note';
import { Users, Notes, Followings } from '../../../models';
import { Note } from '../../../models/entities/note';

const logger = new Logger('pollsUpdate');

export async function triggerUpdate(note: Note) {
	if (!note.updatedAt || Date.now() - new Date(note.updatedAt).getTime() > ms('1min')) {
		logger.info(`Updating ${note.id}`);

		try {
			const updated = await updateQuestion(note.uri);
			logger.info(`Updated ${note.id} ${updated ? 'changed' : 'nochange'}`);
		} catch (e) {
			logger.error(e);
		}
	}
}

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
