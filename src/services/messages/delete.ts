import config from '../../config';
import { MessagingMessages, Users } from '../../models';
import { MessagingMessage } from '../../models/entities/messaging-message';
import { publishGroupMessagingStream, publishMessagingStream } from '../stream';
import { renderActivity } from '../../remote/activitypub/renderer';
import renderDelete from '../../remote/activitypub/renderer/delete';
import renderTombstone from '../../remote/activitypub/renderer/tombstone';
import { deliver } from '../../queue';

export async function deleteMessage(message: MessagingMessage) {
	await MessagingMessages.delete(message.id);
	postDeleteMessage(message);
}

async function postDeleteMessage(message: MessagingMessage) {
	if (message.recipientId) {
		const user = await Users.findOneOrFail(message.userId);
		const recipient = await Users.findOneOrFail(message.recipientId);

		if (Users.isLocalUser(user)) publishMessagingStream(message.userId, message.recipientId, 'deleted', message.id);
		if (Users.isLocalUser(recipient)) publishMessagingStream(message.recipientId, message.userId, 'deleted', message.id);

		if (Users.isLocalUser(user) && Users.isRemoteUser(recipient)) {
			const activity = renderActivity(renderDelete(renderTombstone(`${config.url}/notes/${message.id}`), user));
			deliver(user, activity, recipient.inbox);
		}
	} else if (message.groupId) {
		publishGroupMessagingStream(message.groupId, 'deleted', message.id);
	}
}
