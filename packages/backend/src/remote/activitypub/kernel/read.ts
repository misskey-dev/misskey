import { CacheableRemoteUser } from '@/models/entities/user.js';
import { IRead, getApId } from '../type.js';
import { isSelfHost, extractDbHost } from '@/misc/convert-host.js';
import { MessagingMessages } from '@/models/index.js';
import { readUserMessagingMessage } from '../../../server/api/common/read-messaging-message.js';

export const performReadActivity = async (actor: CacheableRemoteUser, activity: IRead): Promise<string> => {
	const id = await getApId(activity.object);

	if (!isSelfHost(extractDbHost(id))) {
		return `skip: Read to foreign host (${id})`;
	}

	const messageId = id.split('/').pop();

	const message = await MessagingMessages.findOneBy({ id: messageId });
	if (message == null) {
		return `skip: message not found`;
	}

	if (actor.id !== message.recipientId) {
		return `skip: actor is not a message recipient`;
	}

	await readUserMessagingMessage(message.recipientId!, message.userId, [message.id]);
	return `ok: mark as read (${message.userId} => ${message.recipientId} ${message.id})`;
};
