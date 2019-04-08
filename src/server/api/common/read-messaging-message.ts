import { publishMainStream } from '../../../services/stream';
import { publishMessagingStream } from '../../../services/stream';
import { publishMessagingIndexStream } from '../../../services/stream';
import { User } from '../../../models/entities/user';
import { MessagingMessage } from '../../../models/entities/messaging-message';
import { MessagingMessages } from '../../../models';
import { In } from 'typeorm';

/**
 * Mark messages as read
 */
export default async (
	userId: User['id'],
	otherpartyId: User['id'],
	messageIds: MessagingMessage['id'][]
) => {
	if (messageIds.length === 0) return;

	// Update documents
	await MessagingMessages.update({
		id: In(messageIds),
		userId: otherpartyId,
		recipientId: userId,
		isRead: false
	}, {
		isRead: true
	});

	// Publish event
	publishMessagingStream(otherpartyId, userId, 'read', messageIds);
	publishMessagingIndexStream(userId, 'read', messageIds);

	// Calc count of my unread messages
	const count = await MessagingMessages.count({
		recipientId: userId,
		isRead: false
	});

	if (count == 0) {
		// 全ての(いままで未読だった)自分宛てのメッセージを(これで)読みましたよというイベントを発行
		publishMainStream(userId, 'readAllMessagingMessages');
	}
};
