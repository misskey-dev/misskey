import { IRemoteUser } from '@/models/entities/user';
import { IRead, getApId } from '../type';
import { isSelfHost, extractDbHost } from '@/misc/convert-host';
import { MessagingMessages } from '@/models/index';
import { readUserMessagingMessage } from '../../../server/api/common/read-messaging-message';

export const performReadActivity = async (actor: IRemoteUser, activity: IRead): Promise<string> => {
	const id = await getApId(activity.object);

	if (!isSelfHost(extractDbHost(id))) {
		return `skip: Read to foreign host (${id})`;
	}

	const messageId = id.split('/').pop();

	const message = await MessagingMessages.findOne(messageId);
	if (message == null) {
		return `skip: message not found`;
	}

	if (actor.id != message.recipientId) {
		return `skip: actor is not a message recipient`;
	}

	await readUserMessagingMessage(message.recipientId!, message.userId, [message.id]);
	return `ok: mark as read (${message.userId} => ${message.recipientId} ${message.id})`;
};
