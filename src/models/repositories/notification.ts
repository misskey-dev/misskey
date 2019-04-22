import { EntityRepository, Repository } from 'typeorm';
import { Users, Notes } from '..';
import { Notification } from '../entities/notification';
import { ensure } from '../../prelude/ensure';
import { awaitAll } from '../../prelude/await-all';

@EntityRepository(Notification)
export class NotificationRepository extends Repository<Notification> {
	public packMany(
		notifications: any[],
	) {
		return Promise.all(notifications.map(x => this.pack(x)));
	}

	public async pack(
		src: Notification['id'] | Notification,
	) {
		const notification = typeof src === 'object' ? src : await this.findOne(src).then(ensure);

		return await awaitAll({
			id: notification.id,
			createdAt: notification.createdAt,
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
}
