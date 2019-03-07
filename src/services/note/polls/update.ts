import * as mongo from 'mongodb';
import Note, { INote } from '../../../models/note';
import { updateQuestion } from '../../../remote/activitypub/models/question';
import ms = require('ms');
import Logger from '../../logger';
import User, { isLocalUser, isRemoteUser } from '../../../models/user';
import Following from '../../../models/following';
import renderUpdate from '../../../remote/activitypub/renderer/update';
import { renderActivity } from '../../../remote/activitypub/renderer';
import { deliver } from '../../../queue';
import renderNote from '../../../remote/activitypub/renderer/note';

const logger = new Logger('pollsUpdate');

export async function triggerUpdate(note: INote) {
	if (!note.updatedAt || Date.now() - new Date(note.updatedAt).getTime() > ms('1min')) {
		logger.info(`Updating ${note._id}`);

		try {
			const updated = await updateQuestion(note.uri);
			logger.info(`Updated ${note._id} ${updated ? 'changed' : 'nochange'}`);
		} catch (e) {
			logger.error(e);
		}
	}
}

export async function deliverQuestionUpdate(noteId: mongo.ObjectID) {
	const note = await Note.findOne({
		_id: noteId,
	});

	const user = await User.findOne({
		_id: note.userId
	});

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
			const content = renderActivity(renderUpdate(await renderNote(note, false), user));
			for (const inbox of queue) {
				deliver(user, content, inbox);
			}
		}
	}
}
