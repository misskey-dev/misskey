import { EntityRepository, Repository } from 'typeorm';
import { Users, Notes, UserGroupInvitations, AccessTokens } from '..';
import { Notification } from '../entities/notification';
import { ensure } from '../../prelude/ensure';
import { awaitAll } from '../../prelude/await-all';
import { SchemaType } from '../../misc/schema';

export type PackedNotification = SchemaType<typeof packedNotificationSchema>;

@EntityRepository(Notification)
export class NotificationRepository extends Repository<Notification> {
	public async pack(
		src: Notification['id'] | Notification,
	): Promise<PackedNotification> {
		const notification = typeof src === 'object' ? src : await this.findOne(src).then(ensure);
		const token = notification.appAccessTokenId ? await AccessTokens.findOne(notification.appAccessTokenId).then(ensure) : null;

		return await awaitAll({
			id: notification.id,
			createdAt: notification.createdAt.toISOString(),
			type: notification.type,
			userId: notification.notifierId,
			user: notification.notifierId ? Users.pack(notification.notifier || notification.notifierId) : null,
			...(notification.type === 'mention' ? {
				note: Notes.pack(notification.note || notification.noteId!, notification.notifieeId),
			} : {}),
			...(notification.type === 'reply' ? {
				note: Notes.pack(notification.note || notification.noteId!, notification.notifieeId),
			} : {}),
			...(notification.type === 'renote' ? {
				note: Notes.pack(notification.note || notification.noteId!, notification.notifieeId),
			} : {}),
			...(notification.type === 'quote' ? {
				note: Notes.pack(notification.note || notification.noteId!, notification.notifieeId),
			} : {}),
			...(notification.type === 'reaction' ? {
				note: Notes.pack(notification.note || notification.noteId!, notification.notifieeId),
				reaction: notification.reaction
			} : {}),
			...(notification.type === 'pollVote' ? {
				note: Notes.pack(notification.note || notification.noteId!, notification.notifieeId),
				choice: notification.choice
			} : {}),
			...(notification.type === 'groupInvited' ? {
				invitation: UserGroupInvitations.pack(notification.userGroupInvitationId!),
			} : {}),
			...(notification.type === 'app' ? {
				body: notification.customBody,
				header: notification.customHeader || token?.name,
				icon: notification.customIcon || token?.iconUrl,
			} : {}),
		});
	}

	public packMany(
		notifications: any[],
	) {
		return Promise.all(notifications.map(x => this.pack(x)));
	}
}

export const packedNotificationSchema = {
	type: 'object' as const,
	optional: false as const, nullable: false as const,
	properties: {
		id: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'id',
			description: 'The unique identifier for this notification.',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			format: 'date-time',
			description: 'The date that the notification was created.'
		},
		type: {
			type: 'string' as const,
			optional: false as const, nullable: false as const,
			enum: ['follow', 'followRequestAccepted', 'receiveFollowRequest', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote'],
			description: 'The type of the notification.'
		},
		userId: {
			type: 'string' as const,
			optional: true as const, nullable: true as const,
			format: 'id',
		},
		user: {
			type: 'object' as const,
			ref: 'User',
			optional: true as const, nullable: true as const,
		},
	}
};
