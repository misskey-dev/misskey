import { EntityRepository, Repository } from 'typeorm';
import { Users, Notes } from '..';
import rap from '@prezzemolo/rap';
import { Notification } from '../entities/notification';

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
		const notification = typeof src === 'object' ? src : await this.findOne(src);

		return await rap({
			id: notification.id,
			createdAt: notification.createdAt,
			type: notification.type,
			user: Users.pack(notification.notifier || notification.notifierId),
			...(notification.type === 'reaction' ? {
				note: Notes.pack(notification.note || notification.noteId),
				reaction: notification.reaction
			} : {})
		});
	}
}
