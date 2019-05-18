import { publishMainStream, publishGroupMessagingStream } from '../../../services/stream';
import { publishMessagingStream } from '../../../services/stream';
import { publishMessagingIndexStream } from '../../../services/stream';
import { User } from '../../../models/entities/user';
import { MessagingMessage } from '../../../models/entities/messaging-message';
import { MessagingMessages, UserGroupJoinings, Users } from '../../../models';
import { In } from 'typeorm';
import { IdentifiableError } from '../../../misc/identifiable-error';
import { UserGroup } from '../../../models/entities/user-group';

/**
 * Mark messages as read
 */
export async function readUserMessagingMessage(
	userId: User['id'],
	otherpartyId: User['id'],
	messageIds: MessagingMessage['id'][]
) {
	if (messageIds.length === 0) return;

	const messages = await MessagingMessages.find({
		id: In(messageIds)
	});

	for (const message of messages) {
		if (message.recipientId !== userId) {
			throw new IdentifiableError('e140a4bf-49ce-4fb6-b67c-b78dadf6b52f', 'Access denied (user).');
		}
	}

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

	if (!Users.getHasUnreadMessagingMessage(userId)) {
		// 全ての(いままで未読だった)自分宛てのメッセージを(これで)読みましたよというイベントを発行
		publishMainStream(userId, 'readAllMessagingMessages');
	}
}

/**
 * Mark messages as read
 */
export async function readGroupMessagingMessage(
	userId: User['id'],
	groupId: UserGroup['id'],
	messageIds: MessagingMessage['id'][]
) {
	if (messageIds.length === 0) return;

	// check joined
	const joining = await UserGroupJoinings.findOne({
		userId: userId,
		userGroupId: groupId
	});

	if (joining == null) {
		throw new IdentifiableError('930a270c-714a-46b2-b776-ad27276dc569', 'Access denied (group).');
	}

	const messages = await MessagingMessages.find({
		id: In(messageIds)
	});

	const reads = [];

	for (const message of messages) {
		if (message.userId === userId) continue;
		if (message.reads.includes(userId)) continue;

		// Update document
		await MessagingMessages.createQueryBuilder().update()
			.set({
				reads: (() => `array_append("reads", '${joining.userId}')`) as any
			})
			.where('id = :id', { id: message.id })
			.execute();

		reads.push(message.id);
	}

	// Publish event
	publishGroupMessagingStream(groupId, 'read', {
		ids: reads,
		userId: userId
	});
	publishMessagingIndexStream(userId, 'read', reads);

	if (!Users.getHasUnreadMessagingMessage(userId)) {
		// 全ての(いままで未読だった)自分宛てのメッセージを(これで)読みましたよというイベントを発行
		publishMainStream(userId, 'readAllMessagingMessages');
	}
}
