import { EntityRepository, Repository } from 'typeorm';
import { Users, Notes } from '..';
import { Notification } from '../entities/notification';
import { ensure } from '../../prelude/ensure';
import { awaitAll } from '../../prelude/await-all';
import { types, bool, SchemaType } from '../../misc/schema';

export type PackedNotification = SchemaType<typeof packedNotificationSchema>;

@EntityRepository(Notification)
export class NotificationRepository extends Repository<Notification> {
	public async pack(
		src: Notification['id'] | Notification,
	): Promise<PackedNotification> {
		const notification = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return await awaitAll({
			id: notification.id,
			createdAt: notification.createdAt.toISOString(),
			type: notification.type,
			userId: notification.notifierId,
			user: Users.pack(notification.notifier || notification.notifierId),
			...(notification.type === 'mention' ? {
				note: Notes.pack(notification.note || notification.noteId!),
			} : {}),
			...(notification.type === 'reply' ? {
				note: Notes.pack(notification.note || notification.noteId!),
			} : {}),
			...(notification.type === 'renote' ? {
				note: Notes.pack(notification.note || notification.noteId!),
			} : {}),
			...(notification.type === 'quote' ? {
				note: Notes.pack(notification.note || notification.noteId!),
			} : {}),
			...(notification.type === 'reaction' ? {
				note: Notes.pack(notification.note || notification.noteId!),
				reaction: notification.reaction
			} : {}),
			...(notification.type === 'pollVote' ? {
				note: Notes.pack(notification.note || notification.noteId!),
				choice: notification.choice
			} : {})
		});
	}

	public packMany(
		notifications: any[],
	) {
		return Promise.all(notifications.map(x => this.pack(x)));
	}
}

export const packedNotificationSchema = {
	type: types.object,
	optional: bool.false, nullable: bool.false,
	properties: {
		id: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'id',
			description: 'The unique identifier for this notification.',
			example: 'xxxxxxxxxx',
		},
		createdAt: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			format: 'date-time',
			description: 'The date that the notification was created.'
		},
		type: {
			type: types.string,
			optional: bool.false, nullable: bool.false,
			enum: ['follow', 'receiveFollowRequest', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote'],
			description: 'The type of the notification.'
		},
		userId: {
			type: types.string,
			optional: bool.true, nullable: bool.true,
			format: 'id',
		},
		user: {
			type: types.object,
			ref: 'User',
			optional: bool.true, nullable: bool.true,
		},
	}
};
