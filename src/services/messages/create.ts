import { User } from '@/models/entities/user';
import { UserGroup } from '@/models/entities/user-group';
import { DriveFile } from '@/models/entities/drive-file';
import { MessagingMessages, UserGroupJoinings, Mutings, Users } from '@/models/index';
import { genId } from '@/misc/gen-id';
import { MessagingMessage } from '@/models/entities/messaging-message';
import { publishMessagingStream, publishMessagingIndexStream, publishMainStream, publishGroupMessagingStream } from '@/services/stream';
import pushNotification from '../push-notification';
import { Not } from 'typeorm';
import { Note } from '@/models/entities/note';
import renderNote from '@/remote/activitypub/renderer/note';
import renderCreate from '@/remote/activitypub/renderer/create';
import { renderActivity } from '@/remote/activitypub/renderer/index';
import { deliver } from '@/queue/index';

export async function createMessage(user: { id: User['id']; host: User['host']; }, recipientUser: User | undefined, recipientGroup: UserGroup | undefined, text: string | undefined, file: DriveFile | null, uri?: string) {
	const message = {
		id: genId(),
		createdAt: new Date(),
		fileId: file ? file.id : null,
		recipientId: recipientUser ? recipientUser.id : null,
		groupId: recipientGroup ? recipientGroup.id : null,
		text: text ? text.trim() : null,
		userId: user.id,
		isRead: recipientUser ? (Users.isLocalUser(recipientUser) && await Mutings.isMuting(recipientUser?.id, user.id)) : false,
		reads: [] as any[],
		uri
	} as MessagingMessage;

	await MessagingMessages.insert(message);

	const messageObj = await MessagingMessages.pack(message);

	if (recipientUser) {
		if (Users.isLocalUser(user)) {
			// 自分のストリーム
			publishMessagingStream(message.userId, recipientUser.id, 'message', messageObj);
			publishMessagingIndexStream(message.userId, 'message', messageObj);
			publishMainStream(message.userId, 'messagingMessage', messageObj);
		}

		if (Users.isLocalUser(recipientUser)) {
			// 相手のストリーム
			publishMessagingStream(recipientUser.id, message.userId, 'message', messageObj);
			publishMessagingIndexStream(recipientUser.id, 'message', messageObj);
			publishMainStream(recipientUser.id, 'messagingMessage', messageObj);
		}
	} else if (recipientGroup) {
		// グループのストリーム
		publishGroupMessagingStream(recipientGroup.id, 'message', messageObj);

		// メンバーのストリーム
		const joinings = await UserGroupJoinings.find({ userGroupId: recipientGroup.id });
		for (const joining of joinings) {
			publishMessagingIndexStream(joining.userId, 'message', messageObj);
			publishMainStream(joining.userId, 'messagingMessage', messageObj);
		}
	}

	// 2秒経っても(今回作成した)メッセージが既読にならなかったら「未読のメッセージがありますよ」イベントを発行する
	setTimeout(async () => {
		const freshMessage = await MessagingMessages.findOne(message.id);
		if (freshMessage == null) return; // メッセージが削除されている場合もある

		if (recipientUser && Users.isLocalUser(recipientUser)) {
			if (freshMessage.isRead) return; // 既読

			// ただしミュートされているなら発行しない
			// TODO: https://github.com/misskey-dev/misskey/issues/7759#issuecomment-913953978
			if (await Mutings.isMuting(recipientUser.id, user.id)) return;

			publishMainStream(recipientUser.id, 'unreadMessagingMessage', messageObj);
			pushNotification(recipientUser.id, 'unreadMessagingMessage', messageObj);
		} else if (recipientGroup) {
			const joinings = await UserGroupJoinings.find({ userGroupId: recipientGroup.id, userId: Not(user.id) });
			for (const joining of joinings) {
				if (freshMessage.reads.includes(joining.userId)) return; // 既読
				publishMainStream(joining.userId, 'unreadMessagingMessage', messageObj);
				pushNotification(joining.userId, 'unreadMessagingMessage', messageObj);
			}
		}
	}, 2000);

	if (recipientUser && Users.isLocalUser(user) && Users.isRemoteUser(recipientUser)) {
		const note = {
			id: message.id,
			createdAt: message.createdAt,
			fileIds: message.fileId ? [ message.fileId ] : [],
			text: message.text,
			userId: message.userId,
			visibility: 'specified',
			mentions: [ recipientUser ].map(u => u.id),
			mentionedRemoteUsers: JSON.stringify([ recipientUser ].map(u => ({
				uri: u.uri,
				username: u.username,
				host: u.host
			}))),
		} as Note;

		const activity = renderActivity(renderCreate(await renderNote(note, false, true), note));

		deliver(user, activity, recipientUser.inbox);
	}
	return messageObj;
}
