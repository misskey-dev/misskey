import config from '@/config/index.js';
import { MessagingMessages, Users } from '@/models/index.js';
import { MessagingMessage } from '@/models/entities/messaging-message.js';
import { publishGroupMessagingStream, publishMessagingStream } from '@/services/stream.js';
import { renderActivity } from '@/remote/activitypub/renderer/index.js';
import renderDelete from '@/remote/activitypub/renderer/delete.js';
import renderTombstone from '@/remote/activitypub/renderer/tombstone.js';
import { deliver } from '@/queue/index.js';

export async function deleteMessage(message: MessagingMessage) {
	await MessagingMessages.delete(message.id);
	postDeleteMessage(message);
}

async function postDeleteMessage(message: MessagingMessage) {
	if (message.recipientId) {
		const user = await Users.findOneByOrFail({ id: message.userId });
		const recipient = await Users.findOneByOrFail({ id: message.recipientId });

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
