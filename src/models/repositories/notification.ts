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
		notification: Notification['id'] | Notification,
	) {
		const _notification = typeof notification === 'object' ? notification : await this.findOne(notification);

		return await rap({
			id: _notification.id,
			createdAt: _notification.createdAt,
			type: _notification.type,
			user: Users.pack(_notification.notifier || _notification.notifierId),
			...(_notification.type === 'reaction' ? {
				note: Notes.pack(_notification.note || _notification.noteId),
				reaction: _notification.reaction
			} : {})
		});
	}
}
