import * as mongo from 'mongodb';
import Notification from '../models/notification';
import event from '../event';
import serialize from '../serializers/notification';

export default (
	notifiee: mongo.ObjectID,
	notifier: mongo.ObjectID,
	type: string,
	content?: any
) => new Promise<any>(async (resolve, reject) => {
	if (notifiee.equals(notifier)) {
		return resolve();
	}

	// Create notification
	const notification = await Notification.insert(Object.assign({
		created_at: new Date(),
		notifiee_id: notifiee,
		notifier_id: notifier,
		type: type,
		is_read: false
	}, content));

	resolve(notification);

	// Publish notification event
	event(notifiee, 'notification',
		await serialize(notification));
});
